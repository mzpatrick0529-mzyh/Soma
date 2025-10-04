from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="soma-ai-avatar",
    version="0.1.0",
    author="Soma Team",
    description="An emotionally interactive digital memory platform",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.8",
    install_requires=[
        "transformers>=4.30.0",
        "torch>=2.0.0",
        "openai-whisper>=20230314",
        "opencv-python>=4.8.0",
        "pillow>=10.0.0",
        "numpy>=1.24.0",
        "scipy>=1.11.0",
        "librosa>=0.10.0",
        "pydub>=0.25.0",
        "sqlalchemy>=2.0.0",
        "fastapi>=0.100.0",
        "uvicorn>=0.23.0",
        "pydantic>=2.0.0",
        "python-multipart>=0.0.6",
        "aiofiles>=23.0.0",
        "redis>=4.5.0",
        "celery>=5.3.0",
        "sentence-transformers>=2.2.0",
        "langchain>=0.0.200",
        "chromadb>=0.4.0",
    ],
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
)
