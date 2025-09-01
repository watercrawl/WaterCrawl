from knowledge_base.helpers import NoiseRemover

text = """
WaterCrawl transforms websites into structured, AI-ready data with customizable crawling, precise content extraction, JavaScript rendering, and OpenAI integration, facilitating efficient web data harvesting for training, analysis, and applications. It offers extensibility, open-source tools, SDKs, and integrations across various platforms for versatile web content processing.

AI-Powered Processing
    

Built-in OpenAI integration for intelligent content processing. Transform raw HTML into structured, meaningful data automatically.

Extensible Plugin System
    

Create and integrate custom plugins to extend functionality. Process and transform your data exactly how you need it.

JavaScript Rendering
    

Capture dynamic content with configurable wait times and JavaScript rendering. Take screenshots in PDF or JPG format.

Open Source Freedom
    

Built with transparency and collaboration in mind. Customize, extend, and contribute to the growing ecosystem.

## See it in action with WaterCrawl

Try WaterCrawl today and see how it can help you extract data from websites faster and more efficiently.

![Playground Interface](/_next/image?url=https%3A%2F%2Fstorage.watercrawl.dev%2Fwebsite-public%2Fhome_page_logos%2Fplayground.png&w=3840&q=90)

### Playground Interface

Use the interactive playground to test your selectors and extractors.

## Featured Articles
"""

text = NoiseRemover(text, "https://watercrawl.dev").remove_noises()
print(text)
