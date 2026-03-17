import { NextRequest, NextResponse } from 'next/server';
import XlsxPopulate from 'xlsx-populate';
import { getWeeklyBookingsExportRows } from '@/lib/services/booking.service';
import { getWeeklyMenuById } from '@/lib/services/weekly-menu.service';
import { getOrganizationById } from '@/lib/services/organization.service';
import {
  formatDateDDMMYYYY,
  formatDateDDMMYY,
  formatFrenchLongDate,
  getWeekEndFromStart,
  sanitizeForFilename,
} from '@/lib/utils/date.utils';

const TEMPLATE_PATH = 'excel_templates/template.xlsx';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const menuIdParam = searchParams.get('menuId');
  const menuId = menuIdParam ? Number(menuIdParam) : NaN;

  if (!menuIdParam || Number.isNaN(menuId)) {
    return NextResponse.json(
      { message: 'menuId query parameter is required and must be a number' },
      { status: 400 }
    );
  }

  try {
    const [rows, menu] = await Promise.all([
      getWeeklyBookingsExportRows(menuId),
      getWeeklyMenuById(menuId),
    ]);

    if (!menu) {
      return NextResponse.json(
        { message: 'Weekly menu not found for the given menuId' },
        { status: 404 }
      );
    }

    const organization = await getOrganizationById(menu.organizationId);
    if (!organization) {
      return NextResponse.json(
        { message: 'Organization not found for the weekly menu' },
        { status: 404 }
      );
    }

    const weekStart = menu.weekStartDate;
    const weekEnd = getWeekEndFromStart(weekStart);

    // Short ddMMyy format for filenames
    const formattedWeekStartForFile = formatDateDDMMYY(weekStart);
    const formattedWeekEndForFile = formatDateDDMMYY(weekEnd);

    // DD/MM/YY for cell labels
    const formattedWeekStartShort = formatDateDDMMYY(weekStart);
    const formattedWeekEndShort = formatDateDDMMYY(weekEnd);

    const safeOrg = sanitizeForFilename(organization.name);
    const filename = `reservation_${safeOrg}_${formattedWeekStartForFile}_${formattedWeekEndForFile}.xlsx`;

    const workbook = await XlsxPopulate.fromFileAsync(TEMPLATE_PATH);
    const sheet = workbook.sheet(0);

    // Update header cells with real week and organization information
    const cellG6Text = `SEMAINE ${formattedWeekStartShort} AU ${formattedWeekEndShort}`;
    sheet.cell('G6').value(cellG6Text);

    const formattedWeekStartLongUpper = formatFrenchLongDate(weekStart).toUpperCase();
    const formattedWeekEndLongUpper = formatFrenchLongDate(weekEnd).toUpperCase();
    const cellB2Text = `RÉSERVATIONS ${organization.name.toUpperCase()} DU LUNDI ${formattedWeekStartLongUpper} AU VENDREDI ${formattedWeekEndLongUpper}`;
    sheet.range('B2:F3').merged(true).value(cellB2Text);

    const startRow = 10;

    const usedRange = sheet.usedRange();
    const lastRow = usedRange ? usedRange.endCell().rowNumber() : startRow;
    for (let r = startRow; r <= lastRow; r++) {
      sheet.range(`A${r}:S${r}`).value(null);
    }

    rows.forEach((exportRow, index) => {
      const r = startRow + index;
      sheet.cell(`A${r}`).value(exportRow.bookingCreatedAt);
      sheet.cell(`B${r}`).value(exportRow.email);
      sheet.cell(`C${r}`).value(exportRow.organizationName);
      sheet.cell(`D${r}`).value(exportRow.participantLastName);
      sheet.cell(`E${r}`).value(exportRow.participantFirstName);
      sheet.cell(`F${r}`).value(exportRow.participantClass ?? '');
      sheet.cell(`G${r}`).value(exportRow.selectedDaysLabel);
      sheet.cell(`H${r}`).value(exportRow.mondayFlag);
      sheet.cell(`I${r}`).value(exportRow.tuesdayFlag);
      sheet.cell(`J${r}`).value(exportRow.wednesdayFlag);
      sheet.cell(`K${r}`).value(exportRow.thursdayFlag);
      sheet.cell(`L${r}`).value(exportRow.fridayFlag);
      sheet.cell(`M${r}`).value(exportRow.saturdayFlag);
      sheet.cell(`N${r}`).value(exportRow.sundayFlag);
      sheet.cell(`O${r}`).value(exportRow.feedingRegime ?? '');
      sheet.cell(`P${r}`).value(exportRow.phone ?? '');
      sheet.cell(`Q${r}`).value(exportRow.paidFlag);
      sheet.cell(`R${r}`).value(exportRow.comment ?? '');
      sheet.cell(`S${r}`).value(exportRow.paymentEmailSentAt ?? null);
    });

    const buffer = await workbook.outputAsync();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating weekly bookings export:', error);
    return NextResponse.json(
      { message: 'Failed to generate weekly bookings export' },
      { status: 500 }
    );
  }
}

