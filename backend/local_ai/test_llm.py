from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"
)

response = client.chat.completions.create(
    model="qwen2.5-coder-7b-instruct",
    messages=[
        {
            "role": "user",
            "content": "Explain machine learning simply"
        }
    ]
)

print(response.choices[0].message.content)