import trafilatura

metadata_only = trafilatura.settings.Extractor(with_metadata=True)

def get_article_metadata(url):
    dl = trafilatura.fetch_url(url)

    output = trafilatura.extract(dl, options=metadata_only)

    metadata_raw = output.split('---')[1]

    meta_dict = {}

    for row in metadata_raw.split('\n'):
        if not row: continue
        print(row)
        tag, value = row.split(":",1)
        meta_dict[tag.strip()] = value.strip()

    return meta_dict

def get_article_raw(url):
    dl = trafilatura.fetch_url(url)
    return trafilatura.extract(dl, url, favor_precision=True)

if __name__ == "__main__":
    url = "https://www.cp24.com/news/canada/2025/10/03/carney-to-meet-trump-next-week-movement-on-steel-and-aluminum-tariffs-expected/"

    text = get_article_raw(url)
    metadata = get_article_metadata(url)
    # print(text)
    #print(metadata)