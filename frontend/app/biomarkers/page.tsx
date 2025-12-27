"use client";
import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import axios from 'axios';
import { GitMerge } from 'lucide-react';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function Biomarkers() {
    const [loading, setLoading] = useState(true);
    const [corrData, setCorrData] = useState<any>(null);
    const [plsData, setPlsData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [corrRes, plsRes] = await Promise.all([
                    axios.get('http://localhost:8000/api/omics/biomarkers/correlation'),
                    axios.get('http://localhost:8000/api/omics/biomarkers/integration')
                ]);
                setCorrData(corrRes.data);
                setPlsData(plsRes.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getPlsTraces = () => {
        if (plsData.length === 0) return [];
        const groups = [...new Set(plsData.map(d => d['Disease severity']))];

        return groups.map(group => {
            const groupData = plsData.filter(d => d['Disease severity'] === group);
            return {
                x: groupData.map(d => d.comp1_x), // Plotting Transcriptomics Component 1
                y: groupData.map(d => d.comp1_y), // Plotting Metagenomics Component 1
                // Ideally PLS plot is Comp1 vs Comp2 of one block, or Comp1(X) vs Comp1(Y).
                // Let's do Comp1(X) vs Comp1(Y) to show correlation between omics.
                mode: 'markers',
                type: 'scatter',
                name: group,
                text: groupData.map(d => d.Sample),
                marker: { size: 10 }
            };
        });
    };


    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Biomarker Identification</h1>
                <p className="text-slate-500 mt-2">Correlation Analysis: Gene Expression vs Microbial Abundance</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[800px] mb-8">
                <div className="flex items-center space-x-2 mb-4">
                    <GitMerge className="text-purple-500" size={20} />
                    <h3 className="text-lg font-semibold"> Spearman Correlation Heatmap</h3>
                </div>


                {loading && <div className="text-slate-400">Loading correlation analysis... (this may take a moment)</div>}

                {!loading && corrData && (
                    <Plot
                        data={[
                            {
                                z: corrData.z,
                                x: corrData.x,
                                y: corrData.y,
                                type: 'heatmap',
                                colorscale: 'RdBu',
                                zmin: -1,
                                zmax: 1,
                                hoverongaps: false
                            }
                        ]}
                        layout={{
                            autosize: true,
                            margin: { t: 50, r: 50, b: 150, l: 150 },
                            xaxis: { title: { text: 'Microbial Taxa (Genus)' }, tickangle: -45 },
                            yaxis: { title: { text: 'Genes' } },
                            title: { text: 'Top 50 Genes vs Top 20 Taxa' }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                )}

                {!loading && !corrData && (
                    <div className="text-red-400">Failed to load data or insufficient overlapping samples.</div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[500px]">
                    <h3 className="text-lg font-semibold mb-4">Multi-Omics Integration (PLS)</h3>
                    <p className="text-xs text-slate-500 mb-2">Latent Variable Correlation: Transcriptomics (X) vs Metagenomics (Y)</p>
                    {loading && <div className="text-slate-400">Loading PLS analysis...</div>}
                    {!loading && plsData.length > 0 && (
                        <Plot
                            data={getPlsTraces() as any}
                            layout={{
                                autosize: true,
                                margin: { t: 20, r: 20, b: 40, l: 40 },
                                xaxis: { title: { text: 'Transcriptome Latent Comp 1' } },
                                yaxis: { title: { text: 'Microbiome Latent Comp 1' } },
                                hovermode: 'closest'
                            }}

                            useResizeHandler={true}
                            style={{ width: '100%', height: '100%' }}
                        />
                    )}
                    {!loading && plsData.length === 0 && (
                        <div className="text-red-400">Failed to load PLS data or insufficient samples.</div>
                    )}
                </div>

                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-slate-700">
                    <h3 className="font-semibold mb-2">Interpretation</h3>
                    <p className="text-sm mb-4">
                        **Heatmap**: Shows the Spearman correlation coefficients between the top variance genes and the most abundant microbial genera.
                        Red indicates a strong positive correlation, while blue indicates a strong negative correlation.
                    </p>
                    <p className="text-sm">
                        **PLS Integration**: This plot shows how well the two omics datasets correlate in a latent space.
                        A strong linear trend indicates that the gene expression patterns are highly predictive of the microbial community structure.
                        Grouping of samples suggests distinct multi-omics profiles per disease severity.
                    </p>
                </div>
            </div>
        </Layout>
    );
}
