#!/usr/bin/env python
# -*- coding: utf-8 -*-
""" Provides endpoint and web page for simple search API."""
import os
import json
from typing import Iterable, Iterator

from flask import Flask, render_template, abort, jsonify
from webargs.flaskparser import use_kwargs
from webargs import fields

FIELD_NAMES = ['job_history', 'company', 'email', 'city', 'country', 'name']
app = Flask(__name__)


def must_match_field_name(value):
    return value in FIELD_NAMES


def prepare_data(data: Iterable[dict]) -> Iterator[dict]:
    """Make job_history list comma delimited for ease of processing/display.
    """
    for datum in data:
        datum['job_history'] = ', '.join(datum['job_history'])
        yield datum


def filtered_results(data: Iterable[dict],
                     query: str,
                     field: str) -> Iterator[dict]:
    if not query:
        yield from data
        return

    for datum in data:
        if field:
            # Case-insensitive for simplicity
            if query.lower() in datum[field].lower():
                yield datum
        else:
            for field_name in FIELD_NAMES:
                if query.lower() in datum[field_name].lower():
                    yield datum
                    break


@app.route("/", methods=['get'])
def search():
    return render_template('search.html')


@app.route("/search", methods=['get'])
@use_kwargs({
    'query': fields.Str(missing=None),
    'field': fields.Str(missing=None, validate=must_match_field_name),
    'size': fields.Int(missing=20),
    'offset': fields.Int(missing=0)
})
def search_api(query, field, size, offset):
    # File used in this example instead of further API call
    # or database connection
    json_path = os.path.join(app.root_path,
                             'static/json',
                             'mock-contacts.json')
    data = json.load(open(json_path))

    prepped_data = prepare_data(data)
    results = list(filtered_results(prepped_data, query, field))

    index_start = size * offset
    if index_start > len(results):
        abort(400)
    index_stop = min(size + (size * offset), len(results))

    body = {
        'results': results[index_start:index_stop],
        'total': len(results)
    }
    return jsonify(body)


if __name__ == '__main__':
    app.run()
