import PDFDocument from "pdfkit";
import { prisma } from "../db/prisma.js";

export class InvoiceService {
  /**
   * Generates a downloadable PDF buffer for an Order invoice
   */
  public static async generateOrderInvoicePdf(orderId: string): Promise<Buffer> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: true,
        items: {
          include: {
            vendor: true
          }
        }
      }
    });

    if (!order) {
      throw new Error("Commande introuvable pour la génération de facture.");
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: "A4" });
        const buffers: Buffer[] = [];

        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // Header Section
        doc.fillColor("#0F172A").fontSize(22).text("LGF'S MALL", { align: "left" });
        doc.fontSize(10).fillColor("#64748B").text("Plateforme e-Commerce & Micro-Finance du Togo");
        doc.text("Lomé, Togo | Contact: +228 72 99 81 48 | support@lgfmall.com");
        
        doc.moveDown();
        doc.fillColor("#1E293B").fontSize(16).text(`FACTURE N° FAC-${order.id.slice(0, 8).toUpperCase()}`, { align: "right" });
        doc.fontSize(10).fillColor("#64748B").text(`Date: ${new Date(order.createdAt).toLocaleDateString("fr-FR")}`, { align: "right" });
        doc.text(`Statut: ${order.status}`, { align: "right" });

        doc.moveDown();
        doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Customer & Order Information Box
        const startY = doc.y;
        doc.fillColor("#0F172A").fontSize(11).text("CLIENT / DESTINATAIRE:", 40, startY);
        doc.fontSize(10).fillColor("#334155").text(`Nom: ${order.buyer.name}`);
        doc.text(`Email: ${order.buyer.email}`);
        if (order.buyer.phone) doc.text(`Téléphone: ${order.buyer.phone}`);

        doc.fillColor("#0F172A").fontSize(11).text("PAIEMENT & SÉQUESTRE:", 320, startY);
        doc.fontSize(10).fillColor("#334155").text(`Mode de paiement: ${order.paymentMethod || "TMoney / Flooz"}`, 320);
        doc.text(`Référence TX: ${order.paymentTxId || "SECURE-ESCROW-LGF"}`, 320);
        doc.text(`Consigné en séquestre: OUI`, 320);

        doc.moveDown(2);

        // Items Table Header
        const tableTop = doc.y;
        doc.fillColor("#0F172A").fontSize(10).text("DESCRIPTION", 40, tableTop, { width: 230 });
        doc.text("QTE", 280, tableTop, { width: 50, align: "center" });
        doc.text("P.U (FCFA)", 350, tableTop, { width: 90, align: "right" });
        doc.text("TOTAL (FCFA)", 450, tableTop, { width: 100, align: "right" });

        doc.moveDown(0.5);
        doc.strokeColor("#94A3B8").lineWidth(0.5).moveTo(40, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        let currentY = doc.y;
        for (const item of order.items) {
          let itemTitle = "Article";
          if (item.productSnapshot) {
            try {
              const snap = JSON.parse(item.productSnapshot);
              itemTitle = snap.title || itemTitle;
            } catch {}
          }

          doc.fillColor("#334155").fontSize(9).text(itemTitle, 40, currentY, { width: 230 });
          doc.text(String(item.quantity), 280, currentY, { width: 50, align: "center" });
          doc.text(item.unitPrice.toLocaleString("fr-FR"), 350, currentY, { width: 90, align: "right" });
          doc.text(item.subtotal.toLocaleString("fr-FR"), 450, currentY, { width: 100, align: "right" });

          currentY += 20;
        }

        doc.moveDown();
        doc.strokeColor("#E2E8F0").lineWidth(1).moveTo(40, currentY).lineTo(550, currentY).stroke();
        currentY += 15;

        // Total Section
        doc.fillColor("#0F172A").fontSize(12).text("MONTANT TOTAL:", 320, currentY);
        doc.fillColor("#16A34A").fontSize(14).text(`${order.total.toLocaleString("fr-FR")} FCFA`, 430, currentY, { align: "right" });

        // Footer & Legal
        doc.moveDown(4);
        doc.fillColor("#64748B").fontSize(8).text(
          "Cette facture officielle est générée électroniquement par LGF's Mall Togo. Les fonds reçus sont conservés en compte séquestre certifié jusqu'à la confirmation de livraison finale.",
          40,
          720,
          { align: "center", width: 510 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
