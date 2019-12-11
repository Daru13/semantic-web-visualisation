import numpy as np
import pandas as pd

import re
import os
from urllib.parse import urlparse


# Create dataframes with parsed URLs
def parse_URLs(dataframe, input_col_name, output_col_prefix = None):
    if output_col_prefix is None:
        output_col_prefix = input_col_name + "_"

    parsed_urls = [urlparse(uri) for uri in dataframe[input_col_name]]
    split_urls_subset = pd.DataFrame(parsed_urls)[["netloc", "path", "params"]]

    return split_urls_subset.add_prefix(output_col_prefix)


# Create dataframes with possible titles of the resources pointed by URL (using a basic heuristic)
def extract_url_titles(dataframe, input_col_name, output_col_name = None):
    if output_col_name is None:
        output_col_name = input_col_name + "_title"

    # Ignore the "/resource/" prefix in every DBPedia path
    url_paths = dataframe[input_col_name]
    path_titles = url_paths.apply(lambda s: s.replace("/resource/", "").replace("_", " "))

    path_titles = path_titles.rename(output_col_name)
    path_titles = path_titles.rename_axis(output_col_name)

    return path_titles


# Create dataframes containing the language of the ressource pointed by an URI (using a basic heuristic)
languages_and_codes = pd.read_csv("./data/language-codes.csv")

codes_to_languages = {
    **{code.lower(): lang for (code, lang) in zip(languages_and_codes["code_2"], languages_and_codes["language"])},
    **{code.lower(): lang for (code, lang) in zip(languages_and_codes["code_3"], languages_and_codes["language"])}
}

codes_regex = re.compile("|".join([key for key in codes_to_languages.keys()]), re.IGNORECASE)

def extract_url_languages(dataframe, input_col_prefix, output_col_name):
    url_netlocs = dataframe[input_col_prefix + "netloc"]
    url_paths = dataframe[input_col_prefix + "path"]

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


# Create dataframes containing the language of the ressource pointed by an URI (using a basic heuristic)
def extract_url_2nd_domains(dataframe, input_col_prefix, output_col_name = None):
    if output_col_name is None:
        output_col_name = input_col_prefix + "domain2"

    url_netlocs = dataframe[input_col_prefix + "netloc"]

    url_2nd_domains = url_netlocs.apply(lambda netloc: netloc.split(".")[-2])
    url_2nd_domains = url_2nd_domains.rename(output_col_name)
    url_2nd_domains = url_2nd_domains.rename_axis(output_col_name)

    return url_2nd_domains


def process_urls(dataframe):
    parsed_resource_urls = parse_URLs(dataframe, "resource")
    parsed_same_as_urls = parse_URLs(dataframe, "sameAs")

    resource_url_titles = extract_url_titles(parsed_resource_urls, "resource_path", output_col_name = "resource_title")
    same_as_url_titles = extract_url_titles(parsed_same_as_urls, "sameAs_path", output_col_name = "sameAs_title")

    resource_url_languages = extract_url_languages(parsed_resource_urls, "resource_", "resource_language")
    same_as_url_languages = extract_url_languages(parsed_same_as_urls, "sameAs_", "sameAs_language")

    resource_url_2nd_domains = extract_url_2nd_domains(parsed_resource_urls, "resource_")
    same_as_url_2nd_domains = extract_url_2nd_domains(parsed_same_as_urls, "sameAs_")

    # Merge all the dataframes into a single one
    merged_df = dataframe.join([
        parsed_same_as_urls,
        resource_url_titles,
        same_as_url_titles,
        resource_url_languages,
        same_as_url_languages,
        resource_url_2nd_domains,
        same_as_url_2nd_domains
    ])  

    return merged_df