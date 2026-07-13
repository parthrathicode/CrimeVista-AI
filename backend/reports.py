import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# Colors based on CrimeVista AI theme
# Colors based on formal police report theme
BG_COLOR = colors.white
SURFACE_COLOR = colors.white
TEXT_PRIMARY = colors.black
TEXT_MUTED = colors.HexColor('#333333')

def draw_header_footer_first_page(canvas, doc):
    canvas.saveState()
    
    # KSP Logo (if provided by user)
    import os
    logo_path = os.path.join(os.path.dirname(__file__), 'ksp_logo.png')
    
    center_x = letter[0] / 2.0
    # The y-coordinate is the bottom of the image.
    # Image height is 0.7 inch. We want top of image at letter[1] - 0.2 inch.
    # So bottom of image is letter[1] - 0.9 inch.
    image_y = letter[1] - 0.9*inch
    
    if os.path.exists(logo_path):
        try:
            # Draw logo centered at the top
            canvas.drawImage(logo_path, center_x - 0.35*inch, image_y, width=0.7*inch, height=0.7*inch, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass
            
    # Formal Centered Header Text (starts below the image)
    text_y = letter[1] - 1.1*inch
    
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawCentredString(center_x, text_y, "Karnataka State Police")
    
    canvas.setFont('Helvetica', 12)
    canvas.drawCentredString(center_x, text_y - 0.2*inch, "Form No. 76A (Analytics)")
    
    canvas.setFont('Helvetica-Bold', 14)
    canvas.drawCentredString(center_x, text_y - 0.45*inch, "INTELLIGENCE & ANALYTICS REPORT")
    
    # Footer
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica', 9)
    
    note_text = "Note: This is an auto-generated analytics document for Karnataka State Police"
    canvas.drawString(0.5*inch, 0.5*inch, note_text)
    
    page_text = f"Page {doc.page}"
    canvas.drawRightString(letter[0] - 0.5*inch, 0.5*inch, page_text)
    
    canvas.restoreState()

def draw_header_footer_later_pages(canvas, doc):
    canvas.saveState()
    
    center_x = letter[0] / 2.0
    
    # Footer only (no large header on continuation pages)
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica', 9)
    
    note_text = "Note: This is an auto-generated analytics document for Karnataka State Police"
    canvas.drawString(0.5*inch, 0.5*inch, note_text)
    
    page_text = f"Page {doc.page}"
    canvas.drawRightString(letter[0] - 0.5*inch, 0.5*inch, page_text)
    
    canvas.restoreState()

def generate_district_report(district_id: str, report_type: str, date_range: str, data: dict) -> io.BytesIO:
    """
    Generate a highly-styled PDF report using ReportLab.
    """
    buffer = io.BytesIO()
    
    # Create document with tighter margins to fit on 1 page
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=0.5*inch, leftMargin=0.5*inch,
        topMargin=1.7*inch, bottomMargin=0.5*inch
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        alignment=1, # Center alignment
        textColor=colors.black,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        textColor=colors.black,
        spaceAfter=4
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=colors.black,
        spaceAfter=5,
        spaceBefore=10
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leftIndent=20,
        spaceAfter=8,
        textColor=colors.black
    )
    
    signature_style = ParagraphStyle(
        'Signature',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        alignment=2, # Right alignment
        textColor=colors.black,
        spaceAfter=2
    )
    
    small_heading_style = ParagraphStyle(
        'SmallHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.black,
        spaceBefore=15,
        spaceAfter=5
    )
    
    small_text_style = ParagraphStyle(
        'SmallText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.black,
        spaceAfter=3,
        leftIndent=10
    )

    elements = []

    # Report Title
    elements.append(Paragraph(f"In respect of {report_type}", title_style))
    
    # Metadata Block as a formal table
    generated_on = datetime.datetime.now().strftime("%d/%m/%Y")
    
    meta_data = [
        ["District Scope:", data.get('districtName', 'All Karnataka')],
        ["Date Range:", date_range],
        ["Generated On:", generated_on]
    ]
    
    meta_table = Table(meta_data, colWidths=[150, 390])
    meta_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # Summary Table
    if 'totalCases' in data:
        elements.append(Paragraph("EXECUTIVE SUMMARY", heading_style))
        
        trend = data.get('trendPct', 0)
        trend_str = f"+{trend}%" if trend > 0 else f"{trend}%"
        
        table_data = [
            ["Key Metric", "Value", "Notes"],
            ["Total Cases", str(data.get('totalCases', 0)), f"{trend_str} vs prior 30-day period"],
        ]
        
        if 'hotspotCount' in data:
            table_data.append(["Hotspot Count", str(data.get('hotspotCount', 0)), "Active geospatial clusters detected"])
        if 'offenderCount' in data:
            table_data.append(["Repeat Offenders", str(data.get('offenderCount', 0)), "High-risk offender profiles linked"])
            
        t = Table(table_data, colWidths=[150, 100, 250])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f0f0f0')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 4),
            ('TOPPADDING', (0, 0), (-1, 0), 4),
            # Row styling
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
            ('TOPPADDING', (0, 1), (-1, -1), 4),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

    # Recommendations
    if 'recommendations' in data and data['recommendations']:
        elements.append(Paragraph("ACTIONABLE INTELLIGENCE & RECOMMENDATIONS", heading_style))
        
        for rec in data['recommendations']:
            # Using a custom bullet point for a cleaner look
            bullet_text = f"• {rec}"
            elements.append(Paragraph(bullet_text, bullet_style))
            
    footer_elements = []
    
    footer_elements.append(Spacer(1, 15))
    
    # Signature Block (Plain text to match original Police Report and save space)
    footer_elements.append(Paragraph("Digitally Signed", signature_style))
    footer_elements.append(Paragraph("Analytics Division", signature_style))
    footer_elements.append(Paragraph("Karnataka State Police", signature_style))
    
    footer_elements.append(Spacer(1, 10))
    
    # Note Section
    footer_elements.append(Paragraph("Note:", small_heading_style))
    footer_elements.append(Paragraph("(i) This is an auto-generated analytics document.", small_text_style))
    footer_elements.append(Paragraph("(ii) For verification visit the Analytics module on the official portal.", small_text_style))
    footer_elements.append(Paragraph("(iii) Authority utilizing this report must verify against physical records.", small_text_style))
    
    # Disclaimer Section
    footer_elements.append(Paragraph("Disclaimer:", small_heading_style))
    footer_elements.append(Paragraph("(i) This application is for predictive analysis and intelligence reporting only.", small_text_style))
    footer_elements.append(Paragraph("(ii) Report generated under this system is not a subject matter for legal enquiry.", small_text_style))
    footer_elements.append(Paragraph("(iii) In case of emergency or active crime, contact the nearest Police Station.", small_text_style))
    footer_elements.append(Paragraph("(iv) Unauthorized distribution of this intelligence report is prohibited.", small_text_style))

    # Wrap in KeepTogether to prevent page breaks in the middle of the signature/notes
    elements.append(KeepTogether(footer_elements))

    # Build PDF with the custom header/footer
    doc.build(elements, onFirstPage=draw_header_footer_first_page, onLaterPages=draw_header_footer_later_pages)
    
    buffer.seek(0)
    return buffer

def generate_offender_report(offender_data: dict) -> io.BytesIO:
    """
    Generate an official Suspect/Offender Profile Dossier.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=letter,
        rightMargin=0.5*inch, leftMargin=0.5*inch,
        topMargin=1.7*inch, bottomMargin=0.5*inch
    )
    
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'CustomTitle', parent=styles['Heading1'], fontName='Helvetica-Bold',
        fontSize=12, alignment=1, textColor=colors.black,
        spaceAfter=15, textTransform='uppercase'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal', parent=styles['Normal'], fontName='Helvetica',
        fontSize=10, textColor=colors.black, spaceAfter=8
    )
    
    table_header_style = ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.white)
    table_cell_style = ParagraphStyle('TC', parent=styles['Normal'], fontName='Helvetica', fontSize=8, textColor=colors.black)
    
    elements = []
    
    # Title
    elements.append(Paragraph(f"SUBJECT PROFILE: {offender_data.get('name', 'UNKNOWN').upper()}", title_style))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.black, spaceBefore=0, spaceAfter=15))
    
    # Metadata Table
    meta_data = [
        [
            Paragraph("<b>Subject Name:</b>", normal_style), Paragraph(offender_data.get('name', 'N/A'), normal_style),
            Paragraph("<b>Age/Gender:</b>", normal_style), Paragraph(f"{offender_data.get('age', 'N/A')} / {offender_data.get('gender', 'N/A')}", normal_style)
        ],
        [
            Paragraph("<b>Linked Cases:</b>", normal_style), Paragraph(str(len(offender_data.get('linkedCaseIds', []))), normal_style),
            Paragraph("<b>Stations Involved:</b>", normal_style), Paragraph(str(offender_data.get('stationsInvolved', 0)), normal_style)
        ],
        [
            Paragraph("<b>MO Signature:</b>", normal_style), Paragraph(offender_data.get('moSignature', 'N/A'), normal_style),
            Paragraph("<b>Districts:</b>", normal_style), Paragraph(", ".join(offender_data.get('districtIds', [])), normal_style)
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[1.2*inch, 2.5*inch, 1.2*inch, 2.5*inch])
    meta_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 0.5, colors.black),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 6)
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 20))
    
    # Linked Cases List
    elements.append(Paragraph("<b>CONFIRMED LINKED CASES (FIRs)</b>", normal_style))
    
    cases = offender_data.get('linkedCases', [])
    case_data = [[
        Paragraph("FIR No", table_header_style),
        Paragraph("Date", table_header_style),
        Paragraph("Crime Category", table_header_style),
        Paragraph("Sub Type", table_header_style),
        Paragraph("Status", table_header_style)
    ]]
    
    for c in cases:
        case_data.append([
            Paragraph(str(c.get('crimeNo', '')), table_cell_style),
            Paragraph(str(c.get('date', '')).split('T')[0], table_cell_style),
            Paragraph(str(c.get('category', '')), table_cell_style),
            Paragraph(str(c.get('subType', '')), table_cell_style),
            Paragraph(str(c.get('status', '')), table_cell_style)
        ])
        
    case_table = Table(case_data, colWidths=[1.0*inch, 1.0*inch, 2.0*inch, 2.0*inch, 1.4*inch])
    case_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.black),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('TOPPADDING', (0, 0), (-1, 0), 8),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    elements.append(case_table)
    elements.append(Spacer(1, 20))
    
    # Signature Footer (Reusing the style)
    signature_style = ParagraphStyle(
        'Signature', parent=styles['Normal'], fontName='Helvetica-Bold',
        fontSize=10, textColor=colors.black, alignment=2 # Right align
    )
    
    footer_elements = []
    footer_elements.append(Spacer(1, 30))
    footer_elements.append(Paragraph("Digitally Signed", signature_style))
    footer_elements.append(Paragraph("Analytics Division", signature_style))
    footer_elements.append(Paragraph("Karnataka State Police", signature_style))
    footer_elements.append(Spacer(1, 10))
    
    elements.append(KeepTogether(footer_elements))
    
    doc.build(elements, onFirstPage=draw_header_footer_first_page, onLaterPages=draw_header_footer_later_pages)
    
    buffer.seek(0)
    return buffer

