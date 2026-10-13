import React, { useState } from 'react';
import {
  Smartphone,
  Laptop,
  Apple,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  WifiOff,
  Zap,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { usePlanner } from '../../context/usePlanner';
import { usePwa } from '../../hooks/usePwa';

type DeviceTab = 'android' | 'ios' | 'desktop';

export const InstallGuideModal: React.FC = () => {
  const { isInstallModalOpen, closeInstallModal } = usePlanner();
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePwa();

  const [activeTab, setActiveTab] = useState<DeviceTab>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'desktop';
  });

  const [installSuccess, setInstallSuccess] = useState(false);

  const handle1ClickInstall = async () => {
    const result = await promptInstall();
    if (result === 'accepted') {
      setInstallSuccess(true);
      setTimeout(() => {
        closeInstallModal();
      }, 1800);
    }
  };

  return (
    <Modal
      isOpen={isInstallModalOpen}
      onClose={closeInstallModal}
      title="Install UniPlanner App (অ্যাপ ইনস্টল)"
      maxWidth="620px"
    >
      <div className="install-guide-modal-content">
        {/* If already installed notice */}
        {isInstalled || installSuccess ? (
          <div className="install-already-banner">
            <CheckCircle2 size={28} className="install-success-icon" />
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16.5px', fontWeight: 700, color: 'var(--success)' }}>
                UniPlanner is Installed!
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                অ্যাপটি সফলভাবে আপনার ডিভাইসে যুক্ত হয়েছে। এটি সরাসরি হোম স্ক্রিন বা অ্যাপ ড্রয়ার থেকে অফলাইনে ব্যবহার করতে পারবেন।
              </p>
            </div>
          </div>
        ) : null}

        {/* Device Switcher Tabs */}
        <div className="install-device-tabs" role="tablist">
          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'android' ? 'active' : ''}`}
            onClick={() => setActiveTab('android')}
          >
            <Smartphone size={16} />
            <span>Android</span>
          </button>
          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'ios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ios')}
          >
            <Apple size={16} />
            <span>iPhone / iPad</span>
          </button>
          <button
            type="button"
            className={`install-tab-btn ${activeTab === 'desktop' ? 'active' : ''}`}
            onClick={() => setActiveTab('desktop')}
          >
            <Laptop size={16} />
            <span>Laptop / PC</span>
          </button>
        </div>

        {/* Tab Content: Android */}
        {activeTab === 'android' && (
          <div className="install-tab-pane">
            {isInstallable && !isInstalled && !installSuccess && (
              <div className="install-quick-action-box">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15.5px', color: 'var(--accent)' }}>
                    ১-ক্লিক অটো ইনস্টল প্রস্তুত!
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    নিচের বোতামে চাপ দিলে সরাসরি ফোনের হোম স্ক্রিনে অ্যাপ আইকন যোগ হয়ে যাবে।
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handle1ClickInstall}
                  style={{ minHeight: '44px', padding: '10px 18px', fontWeight: 700, fontSize: '14.5px' }}
                >
                  <Download size={16} strokeWidth={2.4} />
                  <span>1-Click Install</span>
                </button>
              </div>
            )}

            <div className="install-steps-list">
              <div className="install-step-item">
                <div className="install-step-num">১</div>
                <div className="install-step-info">
                  <strong>ইনস্টল বোতামে চাপুন</strong>
                  <span>
                    উপরে দেয়া <b>"1-Click Install"</b> বাটনে চাপ দিন (অথবা Chrome ব্রাউজারের উপরে ডানপাশে ৩-ডট মেনু <span className="kbd-badge">⋮</span> ট্যাপ করুন)।
                  </span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">২</div>
                <div className="install-step-info">
                  <strong>"Install App" বা "Add to Home screen" নির্বাচন করুন</strong>
                  <span>ব্রাউজার মেনু থেকে <b>"Install app"</b> অপশনে ট্যাপ করুন।</span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">৩</div>
                <div className="install-step-info">
                  <strong>ইনস্টল কনফার্ম করুন</strong>
                  <span>
                    পপ-আপে <b>"Install"</b> চাপলে সাথে সাথে আপনার মোবাইলের হোম স্ক্রিন ও অ্যাপ ড্রয়ারে UniPlanner আইকন চলে আসবে।
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: iPhone / iOS */}
        {activeTab === 'ios' && (
          <div className="install-tab-pane">
            <div className="install-ios-note-box">
              <Apple size={18} style={{ color: 'var(--text-main)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13.5px', color: 'var(--text-main)', lineHeight: 1.5 }}>
                Apple iOS নীতিমালার কারণে Safari ব্রাউজার সরাসরি পপ-আপ ইনস্টল সমর্থন করে না। তবে Safari দিয়ে ২ সেকেন্ডেই অ্যাপটি আপনার আইফোনের হোম স্ক্রিনে ইনস্টল করা যায়:
              </div>
            </div>

            <div className="install-steps-list">
              <div className="install-step-item">
                <div className="install-step-num">১</div>
                <div className="install-step-info">
                  <strong>Safari ব্রাউজারের Share বোতাম চাপুন</strong>
                  <span>
                    আইফোনের নিচে Safari মেনু বারে থাকা <span className="kbd-badge"><Share size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} /> Share</span> আইকনে চাপ দিন।
                  </span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">২</div>
                <div className="install-step-info">
                  <strong>"Add to Home Screen" অপশন বেছে নিন</strong>
                  <span>
                    মেনুটি একটু নিচে স্ক্রোল করে <span className="kbd-badge"><PlusSquare size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '3px' }} /> Add to Home Screen</span> (হোম স্ক্রিনে যোগ করুন)-এ ট্যাপ করুন।
                  </span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">৩</div>
                <div className="install-step-info">
                  <strong>উপরে ডানপাশে "Add" চাপুন</strong>
                  <span>
                    ব্যস! অ্যাপল অ্যাপ স্টোরের অ্যাপের মতোই UniPlanner আপনার হোম স্ক্রিনে স্বতন্ত্র অ্যাপ হিসেবে যুক্ত হয়ে যাবে।
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Desktop / PC */}
        {activeTab === 'desktop' && (
          <div className="install-tab-pane">
            {isInstallable && !isInstalled && !installSuccess && (
              <div className="install-quick-action-box">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '15.5px', color: 'var(--accent)' }}>
                    ডেস্কটপ ১-ক্লিক ইনস্টল
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    কম্পিউটারে উইন্ডোজ/ম্যাক নেটিভ উইন্ডো হিসেবে ইনস্টল করুন।
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handle1ClickInstall}
                  style={{ minHeight: '44px', padding: '10px 18px', fontWeight: 700, fontSize: '14.5px' }}
                >
                  <Download size={16} strokeWidth={2.4} />
                  <span>Install App</span>
                </button>
              </div>
            )}

            <div className="install-steps-list">
              <div className="install-step-item">
                <div className="install-step-num">১</div>
                <div className="install-step-info">
                  <strong>ব্রাউজারের অ্যাড্রেস বার লক্ষ্য করুন</strong>
                  <span>
                    Google Chrome অথবা Microsoft Edge ব্রাউজারের অ্যাড্রেস বারের ডান কোণে ইনস্টল আইকন <span className="kbd-badge"><ExternalLink size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Install</span> দেখুন।
                  </span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">২</div>
                <div className="install-step-info">
                  <strong>"Install UniPlanner" চাপুন</strong>
                  <span>পপ-আপ আসলে "Install" বাটনে ক্লিক করুন।</span>
                </div>
              </div>

              <div className="install-step-item">
                <div className="install-step-num">৩</div>
                <div className="install-step-info">
                  <strong>টাস্কবারে পিন করে রাখুন</strong>
                  <span>
                    অ্যাপটি কোনো ব্রাউজার ট্যাব ছাড়া ফুলস্ক্রিন উইন্ডোতে চালু হবে এবং ডেস্কটপ শর্টকাট তৈরি হবে।
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Callout Bar */}
        <div className="install-benefits-grid">
          <div className="install-benefit-card">
            <Zap size={16} className="benefit-icon" />
            <div>
              <div className="benefit-title">০ মেগাবাইট প্লে-স্টোর খরচ</div>
              <div className="benefit-desc">কোনো ভারী ডাউনলোড ছাড়াই সেকেন্ডে ইনস্টল হয়</div>
            </div>
          </div>

          <div className="install-benefit-card">
            <WifiOff size={16} className="benefit-icon" />
            <div>
              <div className="benefit-title">১০০% অফলাইনে চালু</div>
              <div className="benefit-desc">ইন্টারনেট বা ওয়াইফাই ছাড়া সব ডেটা অ্যাক্সেসযোগ্য</div>
            </div>
          </div>

          <div className="install-benefit-card">
            <ShieldCheck size={16} className="benefit-icon" />
            <div>
              <div className="benefit-title">ব্যক্তিগত ও সুরক্ষিত</div>
              <div className="benefit-desc">সব কোর্স ও গ্রেড সম্পূর্ণ আপনার মোবাইলে সুরক্ষিত</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Footer Close */}
      <div className="modal-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={closeInstallModal}
          style={{ minHeight: '40px', padding: '8px 20px', fontSize: '14.5px', fontWeight: 600 }}
        >
          বুঝেছি / Close
        </button>
      </div>
    </Modal>
  );
};
