# MicroSeed Localization: Kenya (KES)

MicroSeed is optimized for the Kenyan market, focusing on the unique needs of micro-entrepreneurs in the region.

## Currency Configuration

- **Default Currency**: Kenyan Shilling (KES).
- **Symbol**: KSh.
- **Locale**: `en-KE`.

The currency formatting is handled by the `formatCurrency` utility in `src/lib/currency.ts`, which uses the `Intl.NumberFormat` API for accurate local representation.

## M-PESA Integration

MicroSeed recognizes the importance of M-PESA in the Kenyan economy:
- **Statement Analysis**: The assessment form specifically asks for M-PESA statements as a primary source of financial evidence.
- **Payment Simulation**: The payment flow is designed to mimic mobile money transactions, which are the standard for microloan repayments in Kenya.

## Business Context

The AI assessment (Gemini) is prompted to consider the local context:
- **Industry Types**: Common Kenyan industries like small-scale agriculture, retail (dukas), and services are prioritized.
- **Location Awareness**: The AI considers the business location within Kenya to assess market potential and risks.

## Future Enhancements

- **Direct M-PESA API Integration**: Implementing the Daraja API for automated disbursements and repayments.
- **Swahili Support**: Localizing the UI text into Swahili for better accessibility in rural areas.
- **USSD Interface**: Developing a USSD-based version of the app for users with basic feature phones.
