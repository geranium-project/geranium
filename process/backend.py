from typing import Optional
from fastapi import APIRouter, status
from urllib.parse import quote
import requests
from sparql import *
from parse import *




backend = APIRouter()


@backend.get('/', status_code=status.HTTP_200_OK)
def api(type: Optional[str] = "", topic: Optional[str] = "", lines: Optional[str] = "", offset: Optional[str] = "", url: Optional[str] = ""):
    query = ''
    # Manage publications request
    if type == 'publications':
        query = set_publications_query(topic, lines, offset)
    # Manage authors request
    elif type == 'authors':
        query = set_authors_query(topic, lines, offset)
    # Manage publication details request_type
    elif type == 'publication':
        query = set_publication_details_query(lines, offset, url)
    # Manage author details request
    elif type == 'author':
        query = set_author_details_query(topic, lines, offset, url)
    # Manage all topics request
    elif type == 'topics':
        query = set_topics_query(lines, offset)
    # Manage abstract topic request
    elif type == 'abstract':
        query = set_topic_abstract_query(topic)

    query = quote(query)  # get url encoding

    result = requests.get('http://blazegraph_service:9999/blazegraph/sparql?format=json&query=' + query)

    if not result.ok:
            return 'Invalid query!'

    data = result.json()

    data = data['results']['bindings']

    if type == 'publications':
        return get_publications(data)
    elif type == 'authors':
        return get_authors(data)
    elif type == 'publication':
        return get_publication_details(data)
    elif type == 'author':
        return get_author_details(data)
    elif type == 'topics':
        return get_topics(data)
    elif type == 'abstract':
        return get_abstract(data)

    return 'Invalid request!'


