import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

import os
from urllib.parse import urlparse


# Load dataframes
films_df = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
bands_df = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_df = pd.concat([films_df, bands_df])

#print(all_df)


# Add useful columns
def parse_url_column_into_dataframe(dataframe, column_name):
    parsed_urls = [urlparse(url) for url in dataframe[column_name]]

    parsed_urls_df = pd.DataFrame(parsed_urls)
    parsed_urls_df = parsed_urls_df.add_prefix(column_name + "_")

    return parsed_urls_df

resource_details_df = parse_url_column_into_dataframe(all_df, "resource")
same_as_details_df = parse_url_column_into_dataframe(all_df, "sameAs")


# Merge all the columns into a single dataframe
parsed_urls_df = all_df.join([resource_details_df, same_as_details_df])  

print(parsed_urls_df)


# Write the dataframe into a csv file
output_filename = "./data/generated/parsed-urls.csv"
os.makedirs(os.path.dirname(output_filename), exist_ok = True)

parsed_urls_df.to_csv(output_filename)