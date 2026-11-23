const originalFetch = globalThis.fetch;

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  if (!url.endsWith('/chat/completions') || typeof init.body !== 'string') {
    return originalFetch(input, init);
  }

  const request = JSON.parse(init.body);
  request.response_format = {
    type: 'json_schema',
    json_schema: {
      name: 'pantrypilot_structured_response',
      schema: { type: 'object', additionalProperties: true },
    },
  };
  return originalFetch(input, { ...init, body: JSON.stringify(request) });
};
