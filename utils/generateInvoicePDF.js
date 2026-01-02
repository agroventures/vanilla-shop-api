import PDFDocument from "pdfkit";

export const generateInvoicePDF = (order) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order.orderId}`);
    doc.text(`Customer: ${order.firstName} ${order.lastName}`);
    doc.text(`Email: ${order.email}`);
    doc.text(`Total: ₹${order.totalPrice}`);
    doc.moveDown();

    order.orderItems.forEach((item) => {
      doc.text(`${item.name} × ${item.quantity} — LKR ${item.price}`);
    });

    doc.end();
  });
};
