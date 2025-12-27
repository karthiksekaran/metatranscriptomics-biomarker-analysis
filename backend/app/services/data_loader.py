import pandas as pd
import os
import gzip

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

class DataLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
            cls._instance.metadata = None
            cls._instance.transcriptomics = None
            cls._instance.metagenomics = None
        return cls._instance

    def load_data(self):
        print("Loading data...")
        try:
            # Load Metadata
            meta_path = os.path.join(DATA_DIR, "metadata.xlsx")
            self.metadata = pd.read_excel(meta_path)
            
            # Load Transcriptomics
            trans_path = os.path.join(DATA_DIR, "GSE186651_datacount.txt.gz")
            self.transcriptomics = pd.read_csv(trans_path, sep='\t', compression='gzip', index_col=0)
            
            # Load Metagenomics
            meta_gen_path = os.path.join(DATA_DIR, "GSE186651_Abundance_rawdata.csv.gz")
            self.metagenomics = pd.read_csv(meta_gen_path, compression='gzip')
            
            print("Data loaded successfully.")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False

    def get_metadata(self):
        return self.metadata

    def get_transcriptomics(self):
        return self.transcriptomics

    def get_metagenomics(self):
        return self.metagenomics

data_loader = DataLoader()
