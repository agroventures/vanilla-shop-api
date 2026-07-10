import PDFDocument from "pdfkit";

export function agentPDF(order) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 }); // Added margin for a cleaner look
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    // --- Header & Branding ---
    doc.image("assets/logo.png", 50, 45, { width: 60 });
    doc.fillColor("#444444")
       .fontSize(20)
       .text("THE VANILLA SHOP", { align: "right" });
    
    doc.fontSize(10)
       .text("No. 253, Koswatta, Kaduwela Road, Battaramulla", { align: "right" })
       .text("info@thevanillashop.lk", { align: "right" })
       .moveDown();

    // Horizontal Line
    doc.moveTo(50, 115).lineTo(550, 115).stroke();
    doc.moveDown(2);

    // --- Invoice Meta Data ---
    doc.fillColor("#000000").fontSize(20).text("INVOICE", 50, 130);
    
    doc.fontSize(10)
       .text(`Invoice Number: INV-${order.orderId}`, 50, 155)
       .text(`Date: ${new Date().toLocaleDateString()}`, 50, 170)
       .moveDown();

    // --- Billing Details ---
    doc.fontSize(12).font("Helvetica-Bold").text("Bill To:", 50, 200);
    doc.font("Helvetica").fontSize(10)
       .text(`${order.firstName} ${order.lastName || ""}`)
       .text(`Email: ${order.email}`)
       .text(`Phone: ${order.phone || "N/A"}`);

    // --- Shipping Address ---
    doc.fontSize(12).font("Helvetica-Bold").text("Ship To:", 300, 200);
    doc.font("Helvetica").fontSize(10)
       .text(order.shippingAddress?.street || "N/A", 300)
       .text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""}`.trim().replace(/^,|,$/g, "") || "N/A", 300)
       .text(order.shippingAddress?.postalCode || "", 300)
       .text(order.shippingAddress?.country || "", 300);

    doc.moveDown(2);

    // --- Table Header ---
    const tableTop = 300;
    doc.font("Helvetica-Bold");
    generateTableRow(doc, tableTop, "Item Description", "Qty", "Unit Price", "Total");
    
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // --- Table Items ---
    let i = 0;
    doc.font("Helvetica");
    order.orderItems.forEach((item) => {
      const position = tableTop + 30 + (i * 25);
      const itemTotal = (item.quantity * item.price).toFixed(2);
      
      generateTableRow(
        doc, 
        position, 
        item.name, 
        item.quantity.toString(), 
        `LKR ${item.price}`, 
        `LKR ${itemTotal}`
      );
      i++;
    });

    // --- Footer / Totals ---
    const subtotalPosition = tableTop + 50 + (i * 25);
    doc.moveTo(350, subtotalPosition).lineTo(550, subtotalPosition).stroke();
    
    doc.font("Helvetica-Bold")
       .fontSize(14)
       .text(`Grand Total: LKR ${order.totalPrice}`, 350, subtotalPosition + 15, { align: "right", width: 200 });

    doc.end();
  });
}

// Helper function to keep columns aligned
function generateTableRow(doc, y, item, qty, price, total) {
  doc.fontSize(10)
     .text(item, 50, y)
     .text(qty, 280, y, { width: 30, align: "center" })
     .text(price, 350, y, { width: 90, align: "right" })
     .text(total, 450, y, { width: 100, align: "right" });
}