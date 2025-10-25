#!/usr/bin/env python3
"""
Cross-Encoder Reranker (optional)
Reads JSON from stdin: { "query": str, "candidates": [str], "model": optional str }
Outputs JSON: { "scores": [float] }
"""

import sys, json, os

def main():
  try:
    raw = sys.stdin.read()
    data = json.loads(raw)
    query = data.get('query','')
    cands = data.get('candidates',[])
    model_name = data.get('model') or os.environ.get('CROSS_ENCODER_MODEL') or 'cross-encoder/ms-marco-MiniLM-L-6-v2'
    try:
      from sentence_transformers import CrossEncoder
    except Exception as e:
      # Fallback: return zeros to indicate unavailable
      print(json.dumps({ 'scores': [0.0 for _ in cands] }))
      return
    ce = CrossEncoder(model_name)
    pairs = [(query, c) for c in cands]
    scores = ce.predict(pairs)
    print(json.dumps({ 'scores': [float(x) for x in scores] }))
  except Exception as e:
    print(json.dumps({ 'error': str(e), 'scores': [] }))

if __name__ == '__main__':
  main()
