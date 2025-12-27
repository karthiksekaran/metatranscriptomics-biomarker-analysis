import React from 'react';
import { Home, BarChart2, Dna, FileText, Book } from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
    return (
        <div className="h-screen w-64 bg-slate-900 text-white fixed left-0 top-0 flex flex-col shadow-lg z-50">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
                    OmicsAnalysis
                </h1>
                <p className="text-xs text-slate-400 mt-1">Multi-Omics Platform</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <NavItem href="/" icon={<Home size={20} />} label="Dashboard" />
                <NavItem href="/transcriptomics" icon={<Dna size={20} />} label="Transcriptomics" />
                <NavItem href="/metagenomics" icon={<BarChart2 size={20} />} label="Metagenomics" />
                <NavItem href="/biomarkers" icon={<FileText size={20} />} label="Biomarkers" />
                <NavItem href="/documentation" icon={<Book size={20} />} label="Methodology" />
            </nav>
            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                v1.1.0 (Integrated)
            </div>
        </div>
    );
};

const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    return (
        <Link href={href} className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors">
            {icon}
            <span>{label}</span>
        </Link>
    );
};

export default Sidebar;
