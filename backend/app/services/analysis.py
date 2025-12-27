import pandas as pd
import numpy as np
from scipy import stats
from sklearn.decomposition import PCA
from sklearn.manifold import MDS
from sklearn.preprocessing import StandardScaler
import httpx
import json


def perform_differential_expression(counts: pd.DataFrame, groups: dict):
    """
    Simple DEA using T-test on Log-CPM data.
    groups: {'group1': [col1, col2, ...], 'group2': [col3, col4, ...]}
    """
    # Log-CPM Normalization
    cpm = counts.div(counts.sum(axis=0), axis=1) * 1e6
    log_cpm = np.log2(cpm + 1)
    
    group1_cols = groups['group1']
    group2_cols = groups['group2']
    
    results = []
    
    # Simple T-test per gene
    # In production, vectorization or libraries like statsmodels would be better for speed,
    # but for this dataset 50k genes might be slow if looped.
    # Let's use scipy's ttest_ind which handles axis.
    
    g1_data = log_cpm[group1_cols]
    g2_data = log_cpm[group2_cols]
    
    t_stat, p_val = stats.ttest_ind(g1_data, g2_data, axis=1, equal_var=False)
    
    # Calculate Log2 Fold Change
    # LogFC = Mean(Group1) - Mean(Group2) (if we consider Group1 vs Group2)
    # Usually Treatment vs Control, so Mean(Tx) - Mean(Ctrl)
    # Here we can just return Mean1 - Mean2
    
    log_fc = g1_data.mean(axis=1) - g2_data.mean(axis=1)
    
    results_df = pd.DataFrame({
        'gene': counts.index,
        'logFC': log_fc,
        'p_value': p_val,
        'adj_p_value': p_val # Placeholder for BH correction if needed later
    }).set_index('gene')
    
    results_df['adj_p_value'] = results_df['p_value'] # TODO: Implement BH
    
    return results_df.dropna()

def calculate_diversity_indices(abundance_df: pd.DataFrame):
    """
    Calculate Shannon and Simpson diversity indices.
    Expects filtered abundance matrix (rows=taxa, cols=samples).
    """
    # Ensure relative abundance
    rel_abundance = abundance_df.div(abundance_df.sum(axis=0), axis=1)
    
    shannon = - (rel_abundance * np.log(rel_abundance + 1e-9)).sum(axis=0)
    simpson = 1 - (rel_abundance ** 2).sum(axis=0)
    
    return pd.DataFrame({'shannon': shannon, 'simpson': simpson})

def perform_pca(data: pd.DataFrame, n_components=2):
    """
    Perform PCA on data (features x samples).
    Needs transpose for sklearn.
    """
    # Transpose to (samples x features)
    X = data.T
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    pca = PCA(n_components=n_components)
    coords = pca.fit_transform(X_scaled)
    
    return pd.DataFrame(coords, index=X.index, columns=[f'PC{i+1}' for i in range(n_components)]), pca.explained_variance_ratio_

def perform_pcoa(data_matrix):
    pass
    
def calculate_beta_diversity(abundance_df: pd.DataFrame, n_components=2):
    """
    Calculate Beta Diversity using Bray-Curtis distance and PCoA (MDS).
    abundance_df: Taxa x Samples
    """
    # 1. Normalize to relative abundance
    # Check if we need to pivot first
    if 'Sample' in abundance_df.columns:
        # Pivot: Index=Sample, Columns=Taxa
        abundance_df = abundance_df.pivot_table(index='Sample', columns='Genus', values='Abundance', aggfunc='sum').fillna(0)
        # Transpose to Taxa x Samples for consistency with downstream logic if needed, 
        # BUT this function expects Taxa x Samples? 
        # Let's look at usage. 
        # In endpoints/omics.py: 
        # pivot_df = data_loader.metagenomics.pivot_table(...) 
        # beta_df = analysis.calculate_beta_diversity(pivot_df)
        # So it is ALREADY pivoted in endpoint as Samples x Taxa (Sample is index).
        
        # Wait, pivot_df in endpoint is: pivot_table(index='Sample', ...) -> Rows=Sample.
        # analysis.calculate_diversity_indices says: "Expects filtered abundance matrix (rows=taxa, cols=samples)"
        # But calculate_beta_diversity docstring says: "abundance_df: Taxa x Samples".
        # Let's verify what endpoint passes.
        pass

    # If input is Samples x Taxa (Index is Sample), transpose to Taxa x Samples for consistency with 'div' logic below
    # which does div(sum(axis=0), axis=1) -> dividing columns totals.
    # If input is Samples x Taxa, sum(axis=0) gives sums per Taxa? No.
    # We want relative abundance per SAMPLE.
    
    # If rows=Samples, cols=Taxa: 
    # rel = df.div(df.sum(axis=1), axis=0)
    
    # If rows=Taxa, cols=Samples:
    # rel = df.div(df.sum(axis=0), axis=1)
    
    # Let's assume input is Taxa x Samples (standard OTU table).
    # IF the endpoint passes Samples x Taxa, we must Transpose first.
    # Endpoint: pivot_df = data_loader.metagenomics.pivot_table(index='Sample', columns='Genus', values='Abundance', aggfunc='sum').fillna(0)
    # This produces Samples x Taxa.
    # So we should transpose it at start.
    
    abundance_df = abundance_df.T # Now Taxa x Samples
    
    rel_abundance = abundance_df.div(abundance_df.sum(axis=0), axis=1)
    
    # 2. Transpose to Samples x Taxa for distance calculation
    X = rel_abundance.T
    
    # 3. Calculate Bray-Curtis dissimilarity
    # Since we have many taxa, let's use sklearn's pairwise_distances or scipy
    from sklearn.metrics import pairwise_distances
    bc_dist = pairwise_distances(X, metric='braycurtis')
    
    # 4. PCoA using MDS on the distance matrix
    mds = MDS(n_components=n_components, dissimilarity='precomputed', random_state=42)
    coords = mds.fit_transform(bc_dist)
    
    return pd.DataFrame(coords, index=X.index, columns=[f'PC{i+1}' for i in range(n_components)])



def perform_correlation_analysis(transcriptomics: pd.DataFrame, metagenomics: pd.DataFrame, top_n_genes=50, top_n_taxa=20):
    """
    Perform Spearman correlation between top variable genes and top abundant taxa.
    """
    # 1. Select top genes by variance
    gene_vars = transcriptomics.var(axis=1).sort_values(ascending=False)
    top_genes = gene_vars.head(top_n_genes).index
    df_genes = transcriptomics.loc[top_genes].T # Samples x Genes
    
    # 2. Select top taxa by abundance
    # Metagenomics: Sample | Abundance | Genus ...
    # Pivot to Sample x Genus
    mg_pivot = metagenomics.pivot_table(index='Genus', columns='Sample', values='Abundance', aggfunc='sum').fillna(0)
    # Filter for samples present in both
    common_samples = df_genes.index.intersection(mg_pivot.columns)
    
    if len(common_samples) < 3:
        return pd.DataFrame() # Not enough samples
        
    df_genes = df_genes.loc[common_samples]
    df_taxa = mg_pivot[common_samples].T # Samples x Taxa
    
    # Normalize taxa (relative abundance)
    df_taxa = df_taxa.div(df_taxa.sum(axis=1), axis=0)
    
    # Select top taxa
    top_taxa = df_taxa.mean(axis=0).sort_values(ascending=False).head(top_n_taxa).index
    df_taxa = df_taxa[top_taxa]
    
    # 3. Calculate Correlation
    # We want corr matrix: Genes x Taxa
    # Pandas corrwith or manual loop
    
    corr_matrix = pd.DataFrame(index=top_genes, columns=top_taxa, dtype=float)
    
    for gene in top_genes:
        for taxon in top_taxa:
            corr, _ = stats.spearmanr(df_genes[gene], df_taxa[taxon])
            corr_matrix.loc[gene, taxon] = corr
            
            corr_matrix.loc[gene, taxon] = corr
            
    return corr_matrix

def perform_pls_integration(transcriptomics: pd.DataFrame, metagenomics: pd.DataFrame, n_components=2):
    """
    Perform PLS Canonical correlation analysis to find latent variables integration.
    Closest python equivalent to mixOmics PLS.
    """
    from sklearn.cross_decomposition import PLSCanonical
    
    # Handle pivoting if Y_taxa looks like it has 'Sample' column.
    if 'Sample' in metagenomics.columns and 'Genus' in metagenomics.columns:
         Y_pivot = metagenomics.pivot_table(index='Sample', columns='Genus', values='Abundance', aggfunc='sum').fillna(0)
    else:
         Y_pivot = metagenomics
         
    # Now find intersection
    common_samples = transcriptomics.columns.intersection(Y_pivot.index)
    
    if len(common_samples) < 5:
        # Debugging print
        print(f"Transcriptomics cols: {transcriptomics.columns[:5]}")
        print(f"Metagenomics index: {Y_pivot.index[:5]}")
        return None
        
    X_genes = transcriptomics[common_samples].T # Samples x Genes
    Y_taxa = Y_pivot.loc[common_samples] # Samples x Taxa

    
    # Normalize (Standardize)
    scaler_X = StandardScaler()
    scaler_Y = StandardScaler()
    X_scaled = scaler_X.fit_transform(X_genes)
    Y_scaled = scaler_Y.fit_transform(Y_taxa)
    
    # filter zero variance columns
    X_scaled = X_scaled[:, ~np.all(X_scaled == 0, axis=0)]
    Y_scaled = Y_scaled[:, ~np.all(Y_scaled == 0, axis=0)]

    # PLS
    pls = PLSCanonical(n_components=n_components)
    X_c, Y_c = pls.fit_transform(X_scaled, Y_scaled)
    
    # Return latent variables (Scores) for samples
    scores = pd.DataFrame(index=common_samples)
    scores['comp1_x'] = X_c[:, 0]
    scores['comp2_x'] = X_c[:, 1]
    scores['comp1_y'] = Y_c[:, 0]
    scores['comp2_y'] = Y_c[:, 1]
    
    return scores


async def perform_enrichment_analysis(gene_list: list):
    """
    Perform GO and KEGG enrichment using Enrichr API.
    """
    ADD_LIST_URL = 'https://maayanlab.cloud/Enrichr/addList'
    ENRICH_URL = 'https://maayanlab.cloud/Enrichr/enrich'
    
    try:
        # 1. Add list
        payload = {
            'list': (None, '\n'.join(gene_list)),
            'description': (None, 'Omics Analysis Platform')
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(ADD_LIST_URL, files=payload)
            resp.raise_for_status()
            data = resp.json()
            user_list_id = data['userListId']
            
            # 2. Get Enrichment results
            libraries = ['GO_Biological_Process_2023', 'KEGG_2021_Human']
            results = {}
            
            for lib in libraries:
                query_url = f"{ENRICH_URL}?userListId={user_list_id}&backgroundType={lib}"
                resp = await client.get(query_url)
                if resp.status_code == 200:
                    # Enrichr returns [Rank, Term, P-value, Z-score, Combined Score, Genes, Adj P-val, ...]
                    # We want Term, P-value, Genes
                    raw_data = resp.json()[lib]
                    parsed = []
                    for item in raw_data[:10]: # Top 10
                        parsed.append({
                            'term': item[1],
                            'p_value': item[2],
                            'adj_p_value': item[6],
                            'genes': item[5]
                        })
                    results[lib] = parsed
            
            return results
    except Exception as e:
        print(f"Enrichment Error: {e}")
        return {}

async def get_ppi_network(gene_list: list):
    """
    Fetch PPI interactions from STRING DB API.
    """
    STRING_API_URL = "https://string-db.org/api/json/network"
    
    try:
        # Limit to top 50 genes to avoid explosive network
        genes_to_query = gene_list[:50]
        
        params = {
            "identifiers": "%0d".join(genes_to_query),
            "species": 9606, # Human
            "caller_identity": "omics_platform"
        }
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(STRING_API_URL, data=params)
            if resp.status_code == 200:
                return resp.json()
            return []
    except Exception as e:
        print(f"PPI Error: {e}")
        return []

async def get_drug_interactions(gene_list: list):
    """
    Fetch drug-gene interactions from DGIdb API.
    NOTE: DGIdb API v4 GraphQL is complex, falling back to a simpler OpenTargets or similar if needed.
    Actually, DGIdb v3/v4 has REST endpoints. Let's try to query known druggable genomes.
    For simplicity and stability, we might use a mock or a very simple query if available.
    
    Let's use the DGIdb v4 Interaction Search endpoint if possible, or a simple GET.
    https://dgidb.org/api/v2/interactions.json?genes=...
    """
    DGIDB_URL = "https://dgidb.org/api/v2/interactions.json"
    
    try:
        # Query top 20 genes
        genes_query = ",".join(gene_list[:20])
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{DGIDB_URL}?genes={genes_query}")
            if resp.status_code == 200:
                data = resp.json()
                interactions = []
                for match in data.get('matchedTerms', []):
                    gene_name = match['searchTerm']
                    for cat in match.get('interactions', []):
                        interactions.append({
                            'gene': gene_name,
                            'drug': cat['drugName'],
                            'score': cat['score'],
                            'interaction_type': cat['interactionTypes']
                        })
                return interactions
            return []
    except Exception as e:
        print(f"Drug Interaction Error: {e}")
        return []



