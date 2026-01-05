import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      /* =====================
         COLORS & STYLES
      ====================== */
      const colors = {
        primary: "#000000",      // Deep navy
        secondary: "#16213e",    // Dark blue
        accent: "#e94560",       // Vibrant red/pink
        success: "#00bf63",      // Green
        text: "#2d3748",         // Dark gray
        lightText: "#718096",    // Medium gray
        border: "#e2e8f0",       // Light border
        background: "#f8fafc",   // Light background
        white: "#ffffff",
      };

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;
      const bottomMargin = 120;
      const usableHeight = pageHeight - bottomMargin;

      /* =====================
         HELPER FUNCTIONS
      ====================== */
      const drawLine = (y, color = colors.border, width = contentWidth) => {
        doc.strokeColor(color).lineWidth(1).moveTo(margin, y).lineTo(margin + width, y).stroke();
      };

      const formatCurrency = (amount) => {
        return `LKR ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      };

      const drawTableHeader = (y) => {
        doc.rect(margin, y, contentWidth, 35).fill(colors.primary);
        doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.white);
        const tableHeaders = ["Item", "Qty", "Unit Price", "Total"];
        const colWidths = [250, 60, 90, 95];
        const colPositions = [margin];
        for (let i = 1; i < colWidths.length; i++) colPositions.push(colPositions[i - 1] + colWidths[i - 1]);

        tableHeaders.forEach((header, i) => {
          const align = i === 0 ? "left" : "right";
          const xOffset = i === 0 ? 15 : -15;
          doc.text(header, colPositions[i] + xOffset, y + 12, { width: colWidths[i], align });
        });
        return { colWidths, colPositions };
      };

      /* =====================
         DECORATIVE HEADER BAR
      ====================== */
      doc.rect(0, 0, pageWidth, 8).fill(colors.primary);

      /* =====================
         HEADER SECTION
      ====================== */
      const headerY = 40;
      const logoPath = path.join(process.cwd(), "assets/logo.png");

      // Company Info (Left Side)
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, margin, headerY, { width: 90 });
      } else {
        doc.fontSize(24).font("Helvetica-Bold").fillColor(colors.primary).text("The Vanilla Shop", margin, headerY);
      }

      // Invoice Title (Right Side)
      doc.fontSize(36).font("Helvetica-Bold").fillColor(colors.primary).text("INVOICE", margin, headerY, { width: contentWidth, align: "right" });

      const invoiceNumber = order.orderId || `INV-${Date.now()}`;
      doc.roundedRect(pageWidth - margin - 140, headerY + 45, 140, 25, 4).fill(colors.background);
      doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.primary).text(`# ${invoiceNumber}`, pageWidth - margin - 135, headerY + 52, { width: 130, align: "center" });

      drawLine(130, colors.primary, contentWidth);

      /* =====================
         BILLING & ORDER INFO
      ====================== */
      const infoY = 150;
      const colWidth = contentWidth / 3;

      doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.primary).text("BILLED TO", margin, infoY);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(colors.text).text(`${order.firstName} ${order.lastName}`, margin, infoY + 15);
      doc.fontSize(10).font("Helvetica").fillColor(colors.lightText)
        .text(order.email || "N/A", margin, infoY + 30)
        .text(order.phone || "", margin, infoY + 44);

      if (order.shippingAddress) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.primary).text("SHIP TO", margin + colWidth, infoY);
        doc.fontSize(10).font("Helvetica").fillColor(colors.lightText)
          .text(order.shippingAddress.street || "", margin + colWidth, infoY + 15)
          .text(`${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""}`, margin + colWidth, infoY + 29)
          .text(order.shippingAddress.postalCode || "", margin + colWidth, infoY + 43);
      }

      const detailsX = margin + colWidth * 2;
      doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.primary).text("INVOICE DETAILS", detailsX, infoY);
      doc.fontSize(10).font("Helvetica").fillColor(colors.lightText)
        .text("Invoice Date:", detailsX, infoY + 15)
        .text("Status:", detailsX, infoY + 43);
      doc.font("Helvetica-Bold").fillColor(colors.text)
        .text(formatDate(new Date()), detailsX + 70, infoY + 15)
        .text(formatDate(new Date()), detailsX + 70, infoY + 29);

      const statusColor = order.paymentStatus === "paid" ? colors.success : colors.accent;
      const statusText = order.paymentStatus === "paid" ? "PAID" : "PENDING";
      doc.roundedRect(detailsX + 70, infoY + 40, 50, 18, 3).fill(statusColor);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(colors.white).text(statusText, detailsX + 72, infoY + 45, { width: 46, align: "center" });

      /* =====================
         ITEMS TABLE
      ====================== */
      let tableTop = 250;
      let { colWidths, colPositions } = drawTableHeader(tableTop);
      let yPosition = tableTop + 35;
      const rowHeight = 40;

      order.orderItems.forEach((item, index) => {
        if (yPosition + rowHeight + 150 > usableHeight) {
          doc.addPage();
          // Redraw top accent bar
          doc.rect(0, 0, pageWidth, 8).fill(colors.accent);
          yPosition = 80;
          ({ colWidths, colPositions } = drawTableHeader(yPosition));
          yPosition += 35;
        }

        const rowColor = index % 2 === 0 ? colors.background : colors.white;
        doc.rect(margin, yPosition, contentWidth, rowHeight).fill(rowColor);

        doc.fontSize(10).font("Helvetica-Bold").fillColor(colors.text).text(item.name, colPositions[0] + 15, yPosition + 10, { width: colWidths[0] - 20 });
        if (item.variant) doc.fontSize(8).font("Helvetica").fillColor(colors.lightText).text(item.variant, colPositions[0] + 15, yPosition + 24);
        doc.fontSize(10).font("Helvetica").fillColor(colors.text).text(item.quantity.toString(), colPositions[1], yPosition + 14, { width: colWidths[1] - 15, align: "right" });
        doc.text(formatCurrency(item.price), colPositions[2], yPosition + 14, { width: colWidths[2] - 15, align: "right" });
        doc.font("Helvetica-Bold").text(formatCurrency(item.price * item.quantity), colPositions[3], yPosition + 14, { width: colWidths[3] - 15, align: "right" });

        yPosition += rowHeight;
      });

      // Table Bottom Border
      doc.strokeColor(colors.primary).lineWidth(2).moveTo(margin, yPosition).lineTo(margin + contentWidth, yPosition).stroke();

      /* =====================
         TOTALS SECTION
      ====================== */
      if (yPosition + 200 > usableHeight) {
        doc.addPage();
        yPosition = 80;
      }

      const totalsX = pageWidth - margin - 200;
      let totalsY = yPosition + 20;

      const subtotal = order.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      doc.fontSize(10).font("Helvetica").fillColor(colors.lightText).text("Subtotal:", totalsX, totalsY)
        .fillColor(colors.text).text(formatCurrency(subtotal), totalsX + 80, totalsY, { width: 120, align: "right" });
      totalsY += 20;

      const shipping = order.shippingPrice || 0;
      doc.fillColor(colors.lightText).text("Shipping:", totalsX, totalsY)
        .fillColor(colors.text).text(shipping === 0 ? "FREE" : formatCurrency(shipping), totalsX + 80, totalsY, { width: 120, align: "right" });
      totalsY += 20;

      if (order.tax) {
        doc.fillColor(colors.lightText).text("Tax:", totalsX, totalsY)
          .fillColor(colors.text).text(formatCurrency(order.tax), totalsX + 80, totalsY, { width: 120, align: "right" });
        totalsY += 20;
      }

      if (order.discount) {
        doc.fillColor(colors.lightText).text("Discount:", totalsX, totalsY)
          .fillColor(colors.success).text(`-${formatCurrency(order.discount)}`, totalsX + 80, totalsY, { width: 120, align: "right" });
        totalsY += 20;
      }

      totalsY += 5;
      drawLine(totalsY, colors.border, 200);
      totalsY += 15;

      doc.roundedRect(totalsX - 10, totalsY - 5, 220, 40, 5).fill(colors.primary);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.white).text("GRAND TOTAL", totalsX, totalsY + 7);
      doc.fontSize(14).text(formatCurrency(order.totalPrice), totalsX + 80, totalsY + 5, { width: 120, align: "right" });

      /* =====================
         NOTES & PAYMENT
      ====================== */
      const notesY = Math.max(totalsY + 70, yPosition + 120);

      if (notesY + 80 > usableHeight) {
        doc.addPage();
      }

      if (order.notes) {
        doc.fontSize(9).font("Helvetica-Bold").fillColor(colors.accent).text("NOTES", margin, notesY);
        doc.fontSize(10).font("Helvetica").fillColor(colors.lightText).text(order.notes, margin, notesY + 15, { width: 300 });
      }

      /* =====================
         FOOTER
      ====================== */
      const footerY = pageHeight - 120;
      drawLine(footerY, colors.border);
      doc.fontSize(12).font("Helvetica-Bold").fillColor(colors.primary).text("Thank you for your business!", margin, footerY + 15, { width: contentWidth, align: "center" });
      doc.fontSize(9).font("Helvetica").fillColor(colors.lightText).text("Questions? Contact us at info@thevanillashop.com | +94 70 520 0900", margin, footerY + 35, { width: contentWidth, align: "center" });
      doc.fontSize(8).text(`© ${new Date().getFullYear()} The Vanilla Shop. All rights reserved.`, margin, footerY + 50, { width: contentWidth, align: "center" });
      doc.rect(0, pageHeight - 8, pageWidth, 8).fill(colors.primary);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
