import type { Rfq, RfqItem, Supplier } from './schema';

export function generateRfqEmailDraft(input: { rfq: Rfq; items: RfqItem[]; suppliers: Supplier[]; workspaceName: string }) {
  const responseDate = input.rfq.neededBy ?? 'the requested response deadline';
  const itemList = input.items.map((item, index) => `${index + 1}. ${item.itemName}\n   Quantity: ${item.quantity} ${item.unit ?? 'units'}\n   Specification: ${item.description || 'See attached requirements'}\n   Required date: ${item.requiredDate || input.rfq.neededBy || 'To be confirmed'}\n   Notes: ${item.notes || 'None'}`).join('\n\n');
  return `Subject: RFQ - ${input.rfq.title}\n\nHello,\n\n${input.workspaceName} is requesting a quote for the items below. Please include unit pricing, lead time, freight or delivery terms, payment terms, exceptions, and any recommended alternates.\n\nRFQ: ${input.rfq.title}\n${input.rfq.description ? `Specification: ${input.rfq.description}\n` : ''}${input.rfq.deliveryLocation ? `Delivery location: ${input.rfq.deliveryLocation}\n` : ''}${input.rfq.internalReference ? `Internal reference: ${input.rfq.internalReference}\n` : ''}\nRequested items:\n${itemList}\n\nPlease respond by ${responseDate}. If any requirement is unclear, include assumptions directly in your quote so our purchasing team can compare responses accurately.\n\nThank you,\n${input.workspaceName} Purchasing`; 
}
