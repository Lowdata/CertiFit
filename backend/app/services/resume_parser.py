import fitz
from docx import Document


def extract_pdf_data(file_path: str):

    text = ""
    links = []

    pdf = fitz.open(file_path)

    for page in pdf:

        text += page.get_text()

        page_links = page.get_links()

        for link in page_links:

            uri = link.get("uri")

            if uri:
                links.append(uri)

    pdf.close()

    return {
        "text": text,
        "links": list(set(links))
    }


def extract_docx_data(file_path: str):

    doc = Document(file_path)

    text = "\n".join(
        paragraph.text
        for paragraph in doc.paragraphs
    )

    return {
        "text": text,
        "links": []
    }


def extract_resume_data(file_path: str):

    file_path = file_path.lower()

    if file_path.endswith(".pdf"):
        return extract_pdf_data(file_path)

    if file_path.endswith(".docx"):
        return extract_docx_data(file_path)

    raise ValueError(
        "Only PDF and DOCX supported"
    )