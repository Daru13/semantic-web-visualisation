import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import os
from urllib.parse import urlparse


# Load dataframes
films_df = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
bands_df = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_df = pd.concat([films_df, bands_df]).reset_index(drop = True)

#print(all_df)


# Create dataframes with parsed URIs
def parse_url_column_into_dataframe(dataframe, column_name):
    parsed_urls = [urlparse(url) for url in dataframe[column_name]]

    url_parts_df = pd.DataFrame(parsed_urls)[["netloc", "path", "params"]]
    return url_parts_df.add_prefix(column_name + "_")

parsed_resource_url_df = parse_url_column_into_dataframe(all_df, "resource")
parsed_same_as_url_df = parse_url_column_into_dataframe(all_df, "sameAs")



# Merge several dataframes into a single one
final_df = all_df.join([parsed_resource_url_df, parsed_same_as_url_df])  

print(final_df)


# Write the dataframe into a csv file
output_filename = "./data/generated/parsed-urls.csv"
os.makedirs(os.path.dirname(output_filename), exist_ok = True)

final_df.to_csv(output_filename, index = False)