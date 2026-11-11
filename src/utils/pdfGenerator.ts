import { jsPDF } from 'jspdf';
import { FinalGameStats } from '../types';

export function sanitizeFileName(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Pelumba';
}

/**
 * Generates an official, high-quality A4 Landscape PDF Certificate
 * for Kata Adjektif Racing Quest (Year 5 Malay Grammar).
 */
export function generateCertificatePdf(stats: FinalGameStats): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4', // 297mm x 210mm
  });

  const pageWidth = 297;
  const pageHeight = 210;

  // 1. Elegant Deep Navy & Gold Background Gradient / Fill
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Inner parchment / certificate panel
  doc.setFillColor(254, 252, 246); // warm ivory
  doc.roundedRect(12, 12, pageWidth - 24, pageHeight - 24, 6, 6, 'F');

  // Outer Gold Border
  doc.setDrawColor(202, 138, 4); // gold-600
  doc.setLineWidth(2.2);
  doc.roundedRect(16, 16, pageWidth - 32, pageHeight - 32, 4, 4, 'S');

  // Thin Inner Border
  doc.setDrawColor(217, 119, 6); // amber-600
  doc.setLineWidth(0.6);
  doc.rect(19, 19, pageWidth - 38, pageHeight - 38, 'S');

  // Checkered Ribbon Corner Accents (Racing Theme)
  const drawCornerCheckers = (x: number, y: number, w: number, h: number) => {
    const size = 3;
    for (let r = 0; r < Math.floor(h / size); r++) {
      for (let c = 0; c < Math.floor(w / size); c++) {
        if ((r + c) % 2 === 0) {
          doc.setFillColor(24, 24, 27);
        } else {
          doc.setFillColor(202, 138, 4);
        }
        doc.rect(x + c * size, y + r * size, size, size, 'F');
      }
    }
  };

  drawCornerCheckers(20, 20, 18, 9);
  drawCornerCheckers(pageWidth - 38, 20, 18, 9);
  drawCornerCheckers(20, pageHeight - 29, 18, 9);
  drawCornerCheckers(pageWidth - 38, pageHeight - 29, 18, 9);

  // 2. Header Badges & Ministry/Curriculum Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('KEMENTERIAN PENDIDIKAN MALAYSIA • KURIKULUM STANDARD SEKOLAH RENDAH (KSSR)', pageWidth / 2, 28, {
    align: 'center',
  });
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('BAHASA MELAYU TAHUN 5 • TATABAHASA (SP 5.1.3: KATA ADJEKTIF)', pageWidth / 2, 33, {
    align: 'center',
  });

  // 3. Main Certificate Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('SIJIL PENCAPAIAN', pageWidth / 2, 45, { align: 'center' });

  // Subtitle / Program Name
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59);
  doc.text('KATA ADJEKTIF RACING QUEST', pageWidth / 2, 53, { align: 'center' });

  // Decorative divider
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(1.2);
  doc.line(pageWidth / 2 - 50, 56, pageWidth / 2 + 50, 56);

  // 4. Recipient Name
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text('Dengan ini diperakui bahawa', pageWidth / 2, 65, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42); // slate-900
  const uppercaseName = stats.playerName.toUpperCase();
  doc.text(uppercaseName, pageWidth / 2, 75, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(uppercaseName);
  doc.setDrawColor(202, 138, 4);
  doc.setLineWidth(0.8);
  doc.line(pageWidth / 2 - nameWidth / 2 - 4, 78, pageWidth / 2 + nameWidth / 2 + 4, 78);

  // 5. Statement of Achievement
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'telah berjaya menyelesaikan cabaran pembelajaran interaktif Bahasa Melayu Tahun 5 bagi topik Kata Adjektif',
    pageWidth / 2,
    86,
    { align: 'center' }
  );
  const achievementStatement = stats.bestLapTime
    ? `dan menguasai kemahiran tatabahasa kata adjektif mengikut konteks (Rekod Masa Litar: ${stats.bestLapTime}).`
    : 'dan menguasai kemahiran memahami serta menggunakan pelbagai kata adjektif mengikut konteks.';
  doc.text(
    achievementStatement,
    pageWidth / 2,
    92,
    { align: 'center' }
  );

  // 6. Achievement Metric Cards (Box Container)
  const boxY = 101;
  const boxW = 55;
  const boxH = 26;
  const gap = 8;
  const totalCardsW = 4 * boxW + 3 * gap;
  const startX = (pageWidth - totalCardsW) / 2;

  const cards = [
    { label: 'MARKAH KESELURUHAN', val: `${stats.totalScore} / 150`, sub: 'Pusingan 1 & 2' },
    { label: 'PERATUS PENGUASAAN', val: `${stats.masteryPercentage}%`, sub: 'Sasaran KSSR: 80%' },
    { label: 'KATEGORI PENCAPAIAN', val: stats.achievementTier, sub: 'Status Gamifikasi' },
    { label: 'STATUS SOALAN', val: `${stats.correctCount} / 15`, sub: `${stats.wrongCount} Salah` },
  ];

  cards.forEach((c, idx) => {
    const cx = startX + idx * (boxW + gap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.roundedRect(cx, boxY, boxW, boxH, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, cx + boxW / 2, boxY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(idx === 2 ? 10 : 13);
    doc.setTextColor(idx === 2 ? 180 : 15, idx === 2 ? 83 : 23, idx === 2 ? 9 : 42);
    doc.text(c.val, cx + boxW / 2, boxY + 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(c.sub, cx + boxW / 2, boxY + 22, { align: 'center' });
  });

  // 7. Footer: Official Signatures, Date & Seal
  const footerY = 148;

  // Date Column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('TARIKH PENYELESAIAN', 50, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(stats.completionDate, 50, footerY + 7);
  doc.setDrawColor(203, 213, 225);
  doc.line(35, footerY + 14, 85, footerY + 14);

  // Center Emblem / Trophy Seal
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(1.2);
  doc.circle(pageWidth / 2, footerY + 8, 14, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text('LULUS', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.setFontSize(7);
  doc.text('SP 5.1.3', pageWidth / 2, footerY + 11, { align: 'center' });

  // Signature Column (Guru / Pendidik)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('PENGESAHAN GURU / PENDIDIK', pageWidth - 50, footerY, { align: 'center' });
  doc.setDrawColor(100, 116, 139);
  doc.setLineWidth(0.6);
  doc.line(pageWidth - 85, footerY + 14, pageWidth - 15, footerY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('(Tandatangan & Cop Rasmi Guru)', pageWidth - 50, footerY + 19, { align: 'center' });

  // Bottom Notice
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Sijil ini dijana secara automatik oleh sistem gamifikasi interaktif Kata Adjektif Racing Quest.',
    pageWidth / 2,
    pageHeight - 20,
    { align: 'center' }
  );

  return doc;
}

export function downloadCertificatePdf(stats: FinalGameStats): void {
  const doc = generateCertificatePdf(stats);
  const cleanName = sanitizeFileName(stats.playerName);
  const fileName = `Sijil_${cleanName}_KataAdjektifRacingQuest.pdf`;
  doc.save(fileName);
}
