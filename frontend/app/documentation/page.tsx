"use client";
import React from 'react';
import Layout from '@/components/Layout';
import { Book, Code, Calculator, Info, GitMerge } from 'lucide-react';

export default function Documentation() {
    return (
        <Layout>
            <div className="max-w-4xl mx-auto">
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4">
                        <Book className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Methodology & Documentation</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Comprehensive guide to the statistical methods and bioinformatics workflows used in this Multi-Omic Biomarker Analysis Platform.
                    </p>
                </div>

                <div className="space-y-8">
                    <Section title="Transcriptomics Workflow" icon={<Code className="text-blue-500" />}>
                        <p className="mb-4">
                            We perform Differential Expression Analysis (DEA) to identify genes that vary significantly between different disease severity groups.
                        </p>
                        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                            <ul className="list-disc pl-5 space-y-3 text-slate-700">
                                <li>
                                    <strong>Normalization:</strong> Log-CPM (Counts Per Million).
                                    <div className="mt-2 font-mono text-sm bg-white p-2 rounded border border-slate-200 inline-block text-slate-600">
                                        y = log2((count / total) * 10^6 + 1)
                                    </div>
                                </li>
                                <li><strong>Statistical Test:</strong> Independent T-test (Welch's approximation) assuming unequal variances between groups.</li>
                                <li><strong>Selection Criteria:</strong> Genes with a P-value &lt; 0.05 are considered significant.</li>
                            </ul>
                        </div>
                    </Section>

                    <Section title="Metagenomics Workflow" icon={<Calculator className="text-green-500" />}>
                        <p className="mb-4">
                            Microbial community analysis focuses on understanding alpha diversity (within-sample) and beta diversity (between-sample).
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                                <h4 className="font-semibold mb-2 text-slate-800 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
                                    Alpha Diversity
                                </h4>
                                <p className="text-sm text-slate-600">
                                    Calculated using the <strong>Shannon Index</strong>, which accounts for both abundance and evenness.
                                </p>
                                <div className="mt-2 font-mono text-xs text-slate-500">H = -sum(p_i * ln(p_i))</div>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-lg border border-slate-100">
                                <h4 className="font-semibold mb-2 text-slate-800 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-purple-400 mr-2"></span>
                                    Beta Diversity
                                </h4>
                                <p className="text-sm text-slate-600">
                                    Visualized using <strong>Principal Coordinate Analysis (PCoA)</strong> on the <strong>Bray-Curtis</strong> dissimilarity matrix to show community structural differences.
                                </p>
                            </div>
                        </div>
                    </Section>

                    <Section title="Multi-Omics Integration" icon={<GitMerge className="text-purple-500" />}>
                        <p className="mb-4">
                            Integration of Transcriptomic (Host) and Metagenomic (Microbiome) data to identify cross-omics associations.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">1</div>
                                </div>
                                <div className="ml-4">
                                    <h4 className="font-semibold text-slate-800">Spearman Correlation</h4>
                                    <p className="text-slate-600 text-sm mt-1">Non-parametric correlation performed between the top 50 most variable genes and the top 20 most abundant microbial taxa.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">2</div>
                                </div>
                                <div className="ml-4">
                                    <h4 className="font-semibold text-slate-800">Partial Least Squares (PLS) Integration</h4>
                                    <p className="text-slate-600 text-sm mt-1">
                                        We use PLS-Canonical analysis (via <code>sklearn.cross_decomposition</code>) to identify latent vectors that maximize the covariance between the two omics datasets. This helps visualize how the two modalities vary together across samples.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section title="Built With" icon={<Info className="text-slate-500" />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Frontend</h4>
                                <ul className="space-y-2 text-slate-600 text-sm">
                                    <li className="flex justify-between"><span>Next.js 14</span> <span className="text-slate-400">Framework</span></li>
                                    <li className="flex justify-between"><span>Tailwind CSS</span> <span className="text-slate-400">Styling</span></li>
                                    <li className="flex justify-between"><span>Plotly.js</span> <span className="text-slate-400">Interactive Charts</span></li>
                                    <li className="flex justify-between"><span>Lucide React</span> <span className="text-slate-400">Icons</span></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">Bioinformatics & Statistics</h4>
                                <ul className="space-y-2 text-slate-600 text-sm">
                                    <li className="flex justify-between">
                                        <span>SciPy / Statsmodels</span>
                                        <span className="text-slate-400 text-right">Differential Expression<br />(T-tests, FDR correction)</span>
                                    </li>
                                    <li className="flex justify-between mt-2">
                                        <span>Scikit-learn</span>
                                        <span className="text-slate-400 text-right">Machine Learning<br />(PCoA, PLS-Canonical, MDS)</span>
                                    </li>
                                    <li className="flex justify-between mt-2">
                                        <span>Pandas / NumPy</span>
                                        <span className="text-slate-400 text-right">Data Wrangling<br />(Log-CPM, Abundance Filtering)</span>
                                    </li>
                                    <li className="flex justify-between mt-2">
                                        <span>Python Standard Stack</span>
                                        <span className="text-slate-400 text-right">Custom Algorithms<br />(Shannon Index, Bray-Curtis)</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section title="Note on Bioinformatics Standards" icon={<Info className="text-orange-500" />}>
                        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                            <h4 className="font-bold text-orange-800 mb-2">Why Python-Native Algorithms?</h4>
                            <p className="text-sm text-orange-800 mb-2">
                                Standard bioinformatics workflows often rely on R-based packages (e.g., <strong>DESeq2</strong> for transcriptomics) or complex frameworks like <strong>QIIME2</strong> for metagenomics.
                            </p>
                            <p className="text-sm text-orange-800">
                                For this interactive web platform, we implemented <strong>Python-native equivalents</strong> (using SciPy and Scikit-learn) to ensure:
                            </p>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-orange-800">
                                <li><strong>Real-time Performance:</strong> Immediate calculation of differential expression and correlations without calling external R scripts.</li>
                                <li><strong>Deployment Simplicity:</strong> Removing the need for a mixed Python/R environment or heavy containerization.</li>
                                <li><strong>Statistical Validity:</strong> The methods used (T-test on Log-CPM, Bray-Curtis PCoA, PLS-Canonical) are robust, standard statistical approaches that provide comparable insights for exploration.</li>
                            </ul>
                        </div>

                        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                            <h4 className="flex items-center text-blue-900 font-bold mb-2">
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded uppercase tracking-wider mr-2">Work In Progress</span>
                                Future Roadmap
                            </h4>
                            <p className="text-sm text-blue-800">
                                We are actively working on integrating the standard bioinformatics stack to provide publication-ready results directly from this platform:
                            </p>
                            <ul className="list-disc pl-5 mt-2 text-sm text-blue-800 space-y-1">
                                <li><strong>Transcriptomics:</strong> Integration with <strong>DESeq2</strong> and <strong>edgeR</strong> (via Rpy2) for rigorous differential expression analysis.</li>
                                <li><strong>Metagenomics:</strong> Full pipeline support for <strong>QIIME2</strong> artifacts and <strong>Microeco</strong> for advanced visualization.</li>
                            </ul>
                        </div>
                    </Section>

                </div>
            </div>
        </Layout>
    );
}

const Section = ({ title, icon, children }: any) => (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-50 pb-4">
            <div className="p-2 bg-slate-50 rounded-lg">
                {icon}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="text-slate-600 leading-relaxed">
            {children}
        </div>
    </div>
);
