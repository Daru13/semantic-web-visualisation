import numpy as np
import pandas as pd

import re
import os
from urllib.parse import urlparse


# Load dataframes
films_df = pd.read_csv("data/raw/films/F1_films+genre+sameAs.csv")
bands_df = pd.read_csv("data/raw/musicbands/M1_musicbands+genres+sameAs.csv")
all_df = pd.concat([films_df, bands_df]).reset_index(drop = True)#.sample(n = 100)

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

    return path_titles

resource_url_title_serie = extract_path_title_into_serie(parsed_resource_url_df, "resource_path")
same_as_url_title_serie = extract_path_title_into_serie(parsed_same_as_url_df, "sameAs_path")

#print(resource_url_title_serie)
#print(same_as_url_title_serie)


# Create dataframes containing the language of the ressource pointed by an URI (using a basic heuristic)
languages_df = pd.read_csv("./data/language-codes.csv")

codes_to_languages = {
    **{code.lower(): lang for (code, lang) in zip(languages_df["code_2"], languages_df["language"])},
    **{code.lower(): lang for (code, lang) in zip(languages_df["code_3"], languages_df["language"])}
}

codes_regex = re.compile("|".join([key for key in codes_to_languages.keys()]), re.IGNORECASE)

def extract_language_into_serie(dataframe, col_prefix, output_col_name):
    url_netlocs = dataframe[col_prefix + "netloc"]
    url_paths = dataframe[col_prefix + "path"]

    # Attempt to find a country code in netloc or path
    languages = []

    for netloc, path in zip(url_netlocs, url_paths):
        split_path = path[1:].split("/")
        if len(split_path) > 1:
            # 1. Country code at the beginning of the path (if it contains at least two slashes)
            match = re.fullmatch(codes_regex, split_path[0])
            if match:
                languages.append(codes_to_languages[match.group(0).lower()])
                continue;

        # 2. Country code at the beginning or at the end of the netloc (depending on its structure)
        split_netloc = netloc.split(".")
        string_to_search = split_netloc[0] if len(split_netloc) > 2 else split_netloc[-1]
        
        match = re.fullmatch(codes_regex, split_netloc[0])
        languages.append(codes_to_languages[match.group(0).lower()] if match else "")
    
    url_languages = pd.Series(languages)
    url_languages = url_languages.rename(output_col_name)
    url_languages = url_languages.rename_axis(output_col_name)

    return url_languages

resource_url_language_serie = extract_language_into_serie(parsed_resource_url_df, "resource_", "resource_language")
same_as_url_language_serie = extract_language_into_serie(parsed_same_as_url_df, "sameAs_", "sameAs_language")


# Create dataframes containing the language of the ressource pointed by an URI (using a basic heuristic)
languages_df = pd.read_csv("./data/language-codes.csv")

codes_to_languages = {
    **{code.lower(): lang for (code, lang) in zip(languages_df["code_2"], languages_df["language"])},
    **{code.lower(): lang for (code, lang) in zip(languages_df["code_3"], languages_df["language"])}
}

codes_regex = re.compile("|".join([key for key in codes_to_languages.keys()]), re.IGNORECASE)

def extract_domain2_into_serie(dataframe, col_prefix, output_col_name):
    url_netlocs = dataframe[col_prefix + "netloc"]

    url_domain2 = url_netlocs.apply(lambda netloc: netloc.split(".")[-2])
    url_domain2 = url_domain2.rename(output_col_name)
    url_domain2 = url_domain2.rename_axis(output_col_name)

    return url_domain2

resource_url_domain2_serie = extract_domain2_into_serie(parsed_resource_url_df, "resource_", "resource_domain2")
same_as_url_domain2_serie = extract_domain2_into_serie(parsed_same_as_url_df, "sameAs_", "sameAs_domain2")


# Merge several dataframes into a single one
final_df = all_df.join([
    parsed_resource_url_df,
    parsed_same_as_url_df,
    resource_url_title_serie,
    same_as_url_title_serie,
    resource_url_language_serie,
    same_as_url_language_serie,
    resource_url_domain2_serie,
    same_as_url_domain2_serie
])  

print(final_df)


# Write the dataframe into a csv file
output_filename = "./data/generated/parsed-urls.csv"
os.makedirs(os.path.dirname(output_filename), exist_ok = True)

final_df.to_csv(output_filename, index = False)