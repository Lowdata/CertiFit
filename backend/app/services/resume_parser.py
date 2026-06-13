# resume_parser.py
import fitz

from docx import Document


def extract_pdf_text(file_path: str):

    text = ""

    pdf = fitz.open(file_path)

    for page in pdf:
        text += page.get_text()

    pdf.close()

    return text


def extract_docx_text(file_path: str):

    doc = Document(file_path)

    return "\n".join(
        paragraph.text
        for paragraph in doc.paragraphs
    )


def extract_resume_text(file_path: str):

    file_path = file_path.lower()

    if file_path.endswith(".pdf"):
        return extract_pdf_text(file_path)

    if file_path.endswith(".docx"):
        return extract_docx_text(file_path)

    raise ValueError(
        "Only PDF and DOCX supported"
    )