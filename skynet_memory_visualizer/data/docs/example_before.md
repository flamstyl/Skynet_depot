# rag system

this is about our rag system we use for memory. its pretty good and works well. we store embeddings and then search them

## how it works

basically you put documents in and it makes embeddings with a model. then when you search it finds similar stuff using vector similarity

we use this for:
- remembering stuff
- finding documents
- ai context

## code

```python
def search(query):
    embedding = model.encode(query)
    results = index.search(embedding)
    return results
```

## problems

sometimes its slow
memory usage can be high
need better indexing

thats it
