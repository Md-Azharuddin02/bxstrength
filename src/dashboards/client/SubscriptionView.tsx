import React, { useState, useEffect } from 'react';
import { User, SubscriptionTier, BillingStatement, Subscription } from '../../types';
import { VelocityAPI } from '../../services/api';
import { CreditCard, CheckCircle2, ShieldCheck, Download, FileText, ExternalLink, Dumbbell, Calendar, Tag, Layers } from 'lucide-react';

interface SubscriptionViewProps {
  user: User;
  onShowToast: (msg: string) => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ user, onShowToast }) => {
  const tier: SubscriptionTier = user.subscriptionTier || 'Normal User';
  const statements: BillingStatement[] = user.billingStatements || [];
  const [userSubs, setUserSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    const fetchSubs = () => {
      try {
        const allSubs = VelocityAPI.getSubscriptions();
        const userActive = allSubs.filter(s => s.userEmail.toLowerCase() === user.email.toLowerCase() || s.userId === user.id);
        setUserSubs(userActive);
      } catch (e) {}
    };

    fetchSubs();
    
    const interval = setInterval(fetchSubs, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const tierDetails = {
    'Normal User': {
      price: 0,
      badge: 'NORMAL / FREE MEMBER',
      privileges: [
        'Basic facility & community access',
        'Standard health & symptom search tool access',
        'Self-guided workout logging'
      ]
    },
    'Premium User': {
      price: 49,
      badge: 'PREMIUM ATHLETE TIER',
      privileges: [
        'Assigned personal fitness coach & chat access',
        'Custom workout & training protocols',
        'Group class priority bookings (HIIT, Spin, Boxing)',
        'Progressive biometrics & BMI tracking'
      ]
    },
    'Premium Elite User': {
      price: 89,
      badge: 'PREMIUM ELITE CLUB TIER',
      privileges: [
        '1-on-1 Dedicated Head Coach supervision',
        'Customized nutrition & female cycle-synced diet architecture',
        'Unlimited UK facility, steam room & sauna access',
        'Priority booking for 1-on-1 assessment sessions'
      ]
    }
  }[tier];

  const handleDownloadDocument = (inv: BillingStatement) => {
    if (inv.receiptFileUrl) {
      // Direct Download of Admin Uploaded Payment Slip / Receipt File
      const link = document.createElement('a');
      link.href = inv.receiptFileUrl;
      link.download = inv.fileName || `${inv.invoiceNumber}_Payment_Receipt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onShowToast(`Downloaded official receipt file "${inv.fileName || inv.invoiceNumber}"!`);
    } else {
      // Dynamic Official UK Tax Invoice PDF Document Generator
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BxStrength Official Tax Receipt - ${inv.invoiceNumber}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0c; color: #f4f4f5; margin: 0; padding: 40px; }
    .card { max-width: 650px; margin: 0 auto; background: #121214; border: 1px solid #27272a; padding: 35px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .brand { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; }
    .brand span { color: #10b981; }
    .sub { font-size: 10px; color: #a1a1aa; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-top: 2px; }
    .badge { font-size: 12px; font-weight: 900; color: #10b981; text-align: right; }
    .inv-num { font-family: monospace; font-size: 13px; color: #a1a1aa; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
    .info-box { background: #09090b; p: 15px; padding: 14px; border-radius: 8px; border: 1px solid #27272a; }
    .lbl { font-size: 10px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; }
    .val { font-size: 13px; font-weight: 700; color: #ffffff; margin-top: 4px; }
    table { width: 100%; margin-top: 30px; border-collapse: collapse; }
    th { background: #18181b; color: #a1a1aa; text-transform: uppercase; font-size: 10px; font-weight: 800; padding: 12px; text-align: left; border-bottom: 1px solid #27272a; }
    td { padding: 14px 12px; border-bottom: 1px solid #27272a; font-size: 13px; }
    .total-box { margin-top: 25px; background: #09090b; border: 1px solid #10b981; padding: 16px; border-radius: 8px; text-align: right; }
    .total-val { font-size: 20px; font-weight: 900; color: #10b981; font-family: monospace; }
    .footer { margin-top: 35px; border-top: 1px solid #27272a; pt: 18px; padding-top: 18px; font-size: 10px; color: #71717a; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">BxStrength<span>.</span></div>
        <div class="sub">UK Digital Coaching & Performance Ltd</div>
      </div>
      <div>
        <div class="badge">OFFICIAL TAX RECEIPT</div>
        <div class="inv-num">${inv.invoiceNumber}</div>
      </div>
    </div>

    <div class="grid">
      <div class="info-box">
        <div class="lbl">BILLED TO CLIENT</div>
        <div class="val">${user.name}</div>
        <div style="font-size: 11px; color: #a1a1aa; margin-top: 2px;">${user.email}</div>
      </div>
      <div class="info-box">
        <div class="lbl">ISSUING FACILITY</div>
        <div class="val">BxStrength HQ</div>
        <div style="font-size: 11px; color: #a1a1aa; margin-top: 2px;">185/A, Streetno. 3, Zakir nagar, Okhla, New Delhi - 110025</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ITEM DESCRIPTION</th>
          <th>BILLING DATE</th>
          <th>STATUS</th>
          <th style="text-align: right;">AMOUNT</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight: 700;">${inv.description || user.subscriptionTier || 'Membership Subscription'}</td>
          <td style="font-family: monospace;">${inv.date}</td>
          <td style="color: #10b981; font-weight: 800;">${inv.status.toUpperCase()}</td>
          <td style="text-align: right; font-family: monospace; font-weight: 800;">£${inv.amount}.00</td>
        </tr>
      </tbody>
    </table>

    <div class="total-box">
      <div style="font-size: 10px; color: #a1a1aa; text-transform: uppercase; font-weight: 700;">TOTAL AMOUNT PAID</div>
      <div class="total-val">£${inv.amount}.00 GBP</div>
    </div>

    <div class="footer">
      Official billing document generated for account ${user.email}.<br/>
      BxStrength HQ: 185/A, Streetno. 3, Zakir nagar, Okhla, New Delhi - 110025 | support@bxstrength.com
    </div>
  </div>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${inv.invoiceNumber}_Official_Tax_Receipt.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      onShowToast(`Downloaded tax receipt file for ${inv.invoiceNumber}!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            MY SUBSCRIPTION & SERVICES
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Active plan tier, payment receipts, and upgrade options.
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Plans or No Service State */}
        <div className="lg:col-span-2 space-y-6">
          {userSubs.length > 0 ? (
            <div className="bg-[#121214] border border-[#CCFF00]/40 p-6 rounded-2xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-[#CCFF00]" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">ACTIVE PURCHASED SERVICE PLANS</h3>
                </div>
                <span className="text-xs font-black uppercase px-3 py-1 bg-[#CCFF00] text-black rounded-full">
                  {userSubs.length} ACTIVE PLAN{userSubs.length > 1 ? 'S' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userSubs.map((sub) => (
                  <div key={sub.id} className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                          {sub.serviceType ? `${sub.serviceType.toUpperCase()} MODE` : 'SERVICE PLAN'}
                        </span>
                        <h4 className="text-sm font-black uppercase text-white mt-1.5">{sub.planName}</h4>
                      </div>
                      <span className="text-sm font-black text-[#CCFF00] font-mono">£{sub.price}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#121214] p-3 rounded-lg border border-zinc-800">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">Start Date</span>
                        <span className="font-bold text-white block text-[11px]">{new Date(sub.startDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase block">Expiry Date</span>
                        <span className="font-bold text-[#CCFF00] block text-[11px]">{sub.expiryDate || new Date(sub.nextBillingDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {sub.customExercises && sub.customExercises.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Included Exercises ({sub.customExercises.length}):
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {sub.customExercises.map((ex, i) => (
                            <span key={i} className="text-[9px] bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded">
                              ✓ {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : tier && tier !== 'Normal User' && tierDetails ? (
            <div className="bg-[#111111] border border-gray-800 p-6 relative overflow-hidden rounded-2xl">
              <div className="h-1 w-full bg-emerald-400 absolute top-0 left-0"></div>

              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-1 border border-emerald-800">
                    {tierDetails.badge}
                  </span>
                  <h3 className="text-2xl font-black uppercase text-white mt-2">{tier}</h3>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black text-white font-mono">£{tierDetails.price}</span>
                  <span className="text-xs text-gray-400 block">/ monthly</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs text-gray-300">
                <div>
                  <span className="text-gray-500 font-bold uppercase block">Subscription Status</span>
                  <span className="text-emerald-400 font-bold uppercase flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" /> ACTIVE IN DATABASE
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 font-bold uppercase block">Account Reference</span>
                  <span className="text-white font-mono font-bold mt-0.5 block">{user.email}</span>
                </div>
              </div>

              {/* Included Features */}
              <div className="border-t border-gray-800 pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Included Membership Privileges:</h4>
                {tierDetails.privileges.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#111111] border border-gray-800 p-8 sm:p-12 text-center rounded-2xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                <CreditCard className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">NO SERVICE BOOKED YET</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                You currently have no active service plan or membership subscription booked. Browse our coaching programs and services to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
