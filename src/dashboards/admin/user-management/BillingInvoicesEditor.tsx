import React from 'react';
import { BillingStatement } from '../../../types';

interface BillingInvoicesEditorProps {
  billingStatements: BillingStatement[];
  onAddInvoice: () => void;
  onRemoveInvoice: (invId: string) => void;
  onUploadReceipt: (invId: string, file: File) => void;
}

export const BillingInvoicesEditor: React.FC<BillingInvoicesEditorProps> = ({
  billingStatements,
  onAddInvoice,
  onRemoveInvoice,
  onUploadReceipt
}) => {
  return (
    <div className="pt-2 border-t border-gray-800 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
          Client Billing Invoices ({billingStatements.length})
        </span>
        <button
          type="button"
          onClick={onAddInvoice}
          className="bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800 text-[10px] font-bold px-2 py-1 uppercase rounded transition-colors"
        >
          + Issue Invoice
        </button>
      </div>

      {billingStatements.length === 0 ? (
        <p className="text-[10px] text-gray-500 italic">No billing statements issued yet for this user.</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {billingStatements.map((inv) => (
            <div key={inv.id} className="bg-black p-2.5 border border-gray-800 rounded space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-white block">{inv.invoiceNumber} • £{inv.amount}.00</span>
                  <span className="text-[9px] text-gray-400">{inv.date} • {inv.status}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveInvoice(inv.id)}
                  className="text-red-400 hover:text-red-300 text-[10px] font-bold px-1.5 py-0.5"
                >
                  ✕ Remove
                </button>
              </div>

              {/* Receipt File Upload Control */}
              <div className="pt-1 border-t border-gray-900 flex items-center justify-between gap-2 text-[10px]">
                {inv.fileName ? (
                  <span className="text-emerald-400 font-mono font-bold truncate max-w-[200px]" title={inv.fileName}>
                    📄 Attached: {inv.fileName}
                  </span>
                ) : (
                  <span className="text-gray-500 italic">No document attached</span>
                )}

                <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 text-[9px] font-bold px-2 py-1 rounded uppercase transition-colors shrink-0">
                  <span>{inv.fileName ? 'Change File' : '+ Attach Receipt File'}</span>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) onUploadReceipt(inv.id, file);
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
