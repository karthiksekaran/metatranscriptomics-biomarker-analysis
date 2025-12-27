from fastapi import APIRouter, HTTPException, Query
from app.services.data_loader import data_loader
from app.services import analysis
import pandas as pd
import numpy as np
from pydantic import BaseModel
from typing import List

router = APIRouter()

class GeneList(BaseModel):
    genes: List[str]

@router.on_event("startup")
async def startup_event():
    success = data_loader.load_data()
    if not success:
        print("WARNING: Data failed to load on startup.")

@router.get("/summary")
def get_summary():
    if data_loader.metadata is None:
        raise HTTPException(status_code=503, detail="Data not loaded")
    
    return {
        "samples": len(data_loader.metadata),
        "genes": len(data_loader.transcriptomics) if data_loader.transcriptomics is not None else 0,
        "taxa": len(data_loader.metagenomics) if data_loader.metagenomics is not None else 0,
        "groups": data_loader.metadata['Disease severity'].unique().tolist() if 'Disease severity' in data_loader.metadata.columns else []
    }

@router.get("/transcriptomics/dea")
def get_dea_results(group1: str = Query(..., description="Group 1 name"), group2: str = Query(..., description="Group 2 name")):
    if data_loader.transcriptomics is None:
        raise HTTPException(status_code=503, detail="Transciptomics data not loaded")
    
    # Identify samples for groups based on metadata
    # Assuming 'Disease severity' or 'Characteristics' holds the group info
    # For this specific dataset, let's look at 'Disease severity' or 'Title' to map properly.
    # The user request mentioned 'Disease vs Control'.
    
    meta = data_loader.metadata
    
    # Simple logic: map group names to sample columns
    # We need to match Metadata 'Accession' or 'Title' to Count file columns.
    # Based on Step 12 output: Count columns are AS1_R1, SY1_R1 etc.
    # Metadata Title column has AS1_R1... 
    
    g1_samples = meta[meta['Disease severity'] == group1]['Title'].tolist()
    g2_samples = meta[meta['Disease severity'] == group2]['Title'].tolist()
    
    # Intersect with available columns
    available_cols = data_loader.transcriptomics.columns.tolist()
    g1_samples = [s for s in g1_samples if s in available_cols]
    g2_samples = [s for s in g2_samples if s in available_cols]
    
    if not g1_samples or not g2_samples:
        raise HTTPException(status_code=400, detail=f"No samples found for groups: {group1}, {group2}")
        
    groups = {'group1': g1_samples, 'group2': g2_samples}
    
    dea_res = analysis.perform_differential_expression(data_loader.transcriptomics, groups)
    
    # Return as list of dicts for JSON
    dea_res = dea_res.reset_index()
    return dea_res.to_dict(orient='records')

@router.post("/transcriptomics/enrichment")
async def get_enrichment(genes: GeneList):
    try:
        results = await analysis.perform_enrichment_analysis(genes.genes)
        return results
    except Exception as e:
        print(f"Error in enrichment analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcriptomics/ppi")
async def get_ppi(genes: GeneList):
    try:
        results = await analysis.get_ppi_network(genes.genes)
        return results
    except Exception as e:
        print(f"Error in PPI analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcriptomics/drugs")
async def get_drugs(genes: GeneList):
    try:
        results = await analysis.get_drug_interactions(genes.genes)
        return results
    except Exception as e:
        print(f"Error in Drug analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metagenomics/diversity")
def get_diversity():
    if data_loader.metagenomics is None:
         raise HTTPException(status_code=503, detail="Metagenomics data not loaded")
         
    # Need to pivot metagenomics to be Taxa x Sample
    # The file has: Sample, Abundance, Kingdom...
    # We assume 'Sample' column matches metadata 'Title'
    
    df = data_loader.metagenomics
    # Pivot: Index=Species (or Genus), Columns=Sample, Values=Abundance
    # Let's aggregate at Genus level for robustness
    pivot_df = df.pivot_table(index='Genus', columns='Sample', values='Abundance', aggfunc='sum').fillna(0)
    
    div_df = analysis.calculate_diversity_indices(pivot_df)
    
    # Add metadata for plotting (e.g. Group)
    div_df = div_df.T # Samples as rows logic ?? Wait. 
    # calculate_diversity_indices returns DataFrame with columns 'shannon', 'simpson' and index=Samples (columns of input)
    # Check analysis.py implementation: 
    # rel_abundance = abundance_df.div(sum, axis=1) -> cols are samples.
    # shannon = sum(axis=0) -> result is Series with index=Samples.
    # So div_df has index=Samples.
    
    # Join with metadata
    meta = data_loader.metadata.set_index('Title')
    
    # Calculate Beta Diversity (PCoA)
    beta_df = analysis.calculate_beta_diversity(pivot_df)
    
    # Join everything: Alpha + Beta + Metadata
    # Alpha has index=Samples, Beta has index=Samples
    result = div_df.join(beta_df, how='inner').join(meta[['Disease severity']], how='inner')
    
    return result.reset_index().rename(columns={'index':'Sample'}).to_dict(orient='records')


@router.get("/metagenomics/composition")
def get_composition():
    # Return top N genera relative abundance per sample
    if data_loader.metagenomics is None:
         raise HTTPException(status_code=503, detail="Metagenomics data not loaded")
         
    df = data_loader.metagenomics
    pivot_df = df.pivot_table(index='Genus', columns='Sample', values='Abundance', aggfunc='sum').fillna(0)
    rel_abundance = pivot_df.div(pivot_df.sum(axis=0), axis=1)
    
    # Get top 20 genera by mean abundance
    top_genera = rel_abundance.mean(axis=1).sort_values(ascending=False).head(20).index
    filtered = rel_abundance.loc[top_genera]
    
    # Format for stacked bar chart: [{sample: s1, Genus1: 0.1, Genus2: 0.2...}, ...]
    return filtered.T.reset_index().to_dict(orient='records')

@router.get("/biomarkers/correlation")
def get_correlation():
    if data_loader.transcriptomics is None or data_loader.metagenomics is None:
         raise HTTPException(status_code=503, detail="Data not loaded")
         
    corr_matrix = analysis.perform_correlation_analysis(data_loader.transcriptomics, data_loader.metagenomics)
    
    # Format for Heatmap: z (2D array), x (taxa), y (genes)
    return {
        "z": corr_matrix.values.tolist(),
        "x": corr_matrix.columns.tolist(),
        "y": corr_matrix.index.tolist()
    }

@router.get("/biomarkers/integration")
def get_integration():
    if data_loader.transcriptomics is None or data_loader.metagenomics is None:
         raise HTTPException(status_code=503, detail="Data not loaded")
    
    # PLS Analysis
    scores = analysis.perform_pls_integration(data_loader.transcriptomics, data_loader.metagenomics)
    
    if scores is None:
         raise HTTPException(status_code=400, detail="Insufficient overlapping samples")
         
    # Add metadata for coloring
    meta = data_loader.metadata.set_index('Title')
    result = scores.join(meta[['Disease severity']], how='left')
    
    return result.reset_index().rename(columns={'index':'Sample'}).to_dict(orient='records')
