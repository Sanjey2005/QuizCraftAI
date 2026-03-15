import os
import sys
from decouple import config
from openai import OpenAI

try:
    client = OpenAI(
        base_url='https://integrate.api.nvidia.com/v1',
        api_key=config('NVIDIA_API_KEY'),
    )
    resp = client.chat.completions.create(
        model='meta/llama-3.1-70b-instruct',
        messages=[{'role': 'user', 'content': 'Generate JSON: {"test": 123}'}],
        response_format={'type': 'json_object'},
    )
    print('SUCCESS:', resp.choices[0].message.content)
except Exception as e:
    import traceback
    traceback.print_exc()
