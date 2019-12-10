import numpy as np
import pandas as pd

import os
from urllib.parse import urlparse


# Load dataframes
films_df = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
bands_df = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_df = pd.concat([films_df, bands_df]).reset_index(drop = True)

#print(all_df)


# Create dataframes with parsed URLs
def parse_url_into_dataframe(dataframe, column_name):
    parsed_urls = [urlparse(url) for url in dataframe[column_name]]

    interesting_url_parts = pd.DataFrame(parsed_urls)[["netloc", "path", "params"]]
    return interesting_url_parts.add_prefix(column_name + "_")

parsed_resource_url_df = parse_url_into_dataframe(all_df, "resource")
parsed_same_as_url_df = parse_url_into_dataframe(all_df, "sameAs")

#print(parsed_resource_url_df)
#print(parsed_same_as_url_df)


# Create dataframes with possible titles of the resources pointed by URL (using a basic heuristic)
def extract_path_title_into_serie(dataframe, column_name):
    # Ignore the "/resource/" prefix in every DBPedia path
    url_paths = dataframe[column_name]
    path_titles = url_paths.apply(lambda s: s.replace("/resource/", "").replace("_", " "))

    # Rename the Serie _and_ the only column (for a later join)
    name = column_name + "_title"
    path_titles = path_titles.rename(name)
    path_titles = path_titles.rename_axis(name)

    return path_titles#

resource_url_title_serie = extract_path_title_into_serie(parsed_resource_url_df, "resource_path")
same_as_url_title_serie = extract_path_title_into_serie(parsed_same_as_url_df, "sameAs_path")

#print(resource_url_title_serie)
#print(same_as_url_title_serie)


# Merge several dataframes into a single one
final_df = all_df.join([
    parsed_resource_url_df,
    parsed_same_as_url_df,
    resource_url_title_serie,
    same_as_url_title_serie
])  

print(final_df)


# Write the dataframe into a csv file
output_filename = "./data/generated/parsed-urls.csv"
os.makedirs(os.path.dirname(output_filename), exist_ok = True)

final_df.to_csv(output_filename, index = False)