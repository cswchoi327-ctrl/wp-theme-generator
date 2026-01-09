const { useState } = React;

const WPThemeGenerator = () => {
  const [themeName, setThemeName] = useState('지원금스킨');
  const [themeSlug, setThemeSlug] = useState('support-funds-theme');
  const [tabs, setTabs] = useState(['청년지원금', '주거지원금', '창업지원금']);
  const [tabLinks, setTabLinks] = useState(['', '', '']);
  const [headerTitle, setHeaderTitle] = useState('지원금 스킨');
  const [connectUrl, setConnectUrl] = useState('');
  const [keywords, setKeywords] = useState(['청년도약계좌', '전월세보증금지원', '청년창업지원금', '근로장려금', '자녀장려금', '국민취업지원제도', '청년내일채움공제', '청년월세지원', '소상공인정책자금']);
  const [adCode, setAdCode] = useState('');
  const [footerBrand, setFooterBrand] = useState('블로그(사업자)명');
  const [footerAddress, setFooterAddress] = useState('사업자 주소:');
  const [footerBizNum, setFooterBizNum] = useState('123-45-67890');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState({});
  const [errors, setErrors] = useState({});
  const [copyStatus, setCopyStatus] = useState('');

  const getCurrentDate = () => {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  };

  const handleTabChange = (i, v) => { const n = [...tabs]; n[i] = v; setTabs(n); };
  const handleTabLinkChange = (i, v) => { const n = [...tabLinks]; n[i] = v; setTabLinks(n); };
  const handleKeywordChange = (i, v) => { const n = [...keywords]; n[i] = v; setKeywords(n); };

  const validateInputs = () => {
    const newErrors = {};
    if (!themeName.trim()) newErrors.themeName = '테마 이름을 입력해주세요';
    if (!themeSlug.trim()) newErrors.themeSlug = '테마 슬러그를 입력해주세요';
    if (tabs.filter(t => t.trim()).length === 0) newErrors.tabs = '최소 1개의 탭을 입력해주세요';
    if (!keywords.some(k => k.trim())) newErrors.keywords = '최소 1개의 키워드를 입력해주세요';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTheme = async () => {
    if (!validateInputs()) return;
    setIsGenerating(true);
    setErrors({});

    const mainUrl = connectUrl || 'https://example.com/';
    const title = headerTitle || '지원금 스킨';
    const activeKeywords = keywords.filter(k => k.trim());

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `다음 키워드들에 대해 각각 후킹성 있고 정확한 카드 내용을 만들어줘.

키워드: ${activeKeywords.join(', ')}

각 키워드에 대해 다음 형식의 JSON 배열로만 답변해:
[
  {
    "keyword": "키워드명",
    "amount": "금액/혜택 강조 (예: 최대 4.5% 금리, 월 50만원, 최대 5000만원)",
    "amountSub": "부가 설명 (예: 비과세 + 대출 우대, 최대 6개월 지급)",
    "description": "한 줄 설명 (예: 청년 무주택자를 위한 높은 금리의 우대형 청약통장)",
    "target": "지원대상 (예: 만 19~34세 청년) - 반드시 20글자 이내",
    "period": "신청시기 (예: 상시, 매년 5월)"
  }
]

주의사항:
- 실제 정책/제도 정보에 기반하여 정확하게 작성
- amount는 숫자와 단위를 포함한 임팩트 있는 문구
- target(지원대상)은 반드시 공백 포함 20글자 이내로 작성
- 후킹성 있게 작성하되 허위정보는 금지
- JSON만 출력, 다른 텍스트 없이`
          }]
        })
      });

      const data = await response.json();
      let jsonText = data.content?.find(item => item.type === "text")?.text || "[]";
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?$/g, "").trim();
      const cardData = JSON.parse(jsonText);

      // 파일 생성
      const files = {};
      
      // style.css
      files['style.css'] = generateStyleCSS(themeName, themeSlug);
      
      // header.php
      files['header.php'] = generateHeaderPHP(title, tabs, tabLinks, adCode, mainUrl);
      
      // footer.php
      files['footer.php'] = generateFooterPHP(footerBrand, footerAddress, footerBizNum);
      
      // index.php
      files['index.php'] = generateIndexPHP(cardData, mainUrl, adCode);
      
      // functions.php
      files['functions.php'] = generateFunctionsPHP(themeSlug);
      
      // custom.js
      files['custom.js'] = generateCustomJS();
      
      // screenshot.png는 제외 (실제로는 이미지 필요)
      
      setGeneratedFiles(files);
      setIsGenerating(false);
    } catch (error) {
      console.error("생성 오류:", error);
      setErrors({ generate: 'AI 생성 중 오류가 발생했습니다. 다시 시도해주세요.' });
      setIsGenerating(false);
    }
  };

  const downloadAsZip = async () => {
    const zip = new JSZip();
    const folder = zip.folder(themeSlug);
    
    Object.entries(generatedFiles).forEach(([filename, content]) => {
      folder.file(filename, content);
    });
    
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${themeSlug}.zip`);
  };

  const copyFile = async (filename) => {
    try {
      await navigator.clipboard.writeText(generatedFiles[filename]);
      setCopyStatus(filename);
      setTimeout(() => setCopyStatus(''), 2000);
    } catch (e) {
      console.error('복사 실패', e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-end">
            <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-purple-200 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">최신 업데이트</span>
              <span className="text-sm font-bold text-purple-600">{getCurrentDate()}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="bg-white rounded-2xl p-6 mx-4 border border-purple-200 relative">
            <p className="absolute top-4 left-4 text-purple-600 font-bold text-2xl sm:text-3xl">아백</p>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold bg-gradient-to-r from-purple-600 to-indigo-800 bg-clip-text text-transparent mt-8">
              워드프레스 지원금 테마 생성기
            </h1>
            <p className="text-gray-600 text-sm mt-4">키워드를 입력하면 AI가 완전한 워드프레스 테마를 생성합니다</p>
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700">{Object.values(errors).map((e, i) => <p key={i} className="text-sm">{e}</p>)}</div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-purple-200">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-purple-600">테마 이름 <span className="text-red-500">*</span></label>
                <input type="text" value={themeName} onChange={(e) => setThemeName(e.target.value)} placeholder="지원금스킨" className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-purple-600">테마 슬러그 (영문) <span className="text-red-500">*</span></label>
                <input type="text" value={themeSlug} onChange={(e) => setThemeSlug(e.target.value)} placeholder="support-funds-theme" className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-purple-600">헤더 제목</label>
              <input type="text" value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} placeholder="지원금 스킨" className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-purple-600">탭 메뉴 (최대 3개) <span className="text-red-500">*</span></label>
              <div className="space-y-2">
                {tabs.map((tab, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={tab} onChange={(e) => handleTabChange(i, e.target.value)} placeholder={`탭 ${i + 1}`} className="flex-1 px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
                    <input type="url" value={tabLinks[i]} onChange={(e) => handleTabLinkChange(i, e.target.value)} placeholder="링크 URL" className="flex-1 px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-purple-600">연결할 URL</label>
              <input type="url" value={connectUrl} onChange={(e) => setConnectUrl(e.target.value)} placeholder="https://example.com" className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
            </div>

            <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50">
              <label className="block text-sm font-bold mb-3 text-purple-600">키워드 입력 (최대 9개) <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {keywords.map((kw, i) => (
                  <input key={i} type="text" value={kw} onChange={(e) => handleKeywordChange(i, e.target.value)} placeholder={`키워드 ${i + 1}`} className="w-full px-3 py-2 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 bg-white text-sm" />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-2 text-purple-600">애드센스 광고 코드</label>
              <textarea value={adCode} onChange={(e) => setAdCode(e.target.value)} placeholder="애드센스 코드 (선택)" rows={3} className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500 font-mono text-xs" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold mb-2 text-purple-600">푸터 브랜드명</label>
                <input type="text" value={footerBrand} onChange={(e) => setFooterBrand(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-purple-600">푸터 주소</label>
                <input type="text" value={footerAddress} onChange={(e) => setFooterAddress(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2 text-purple-600">사업자번호</label>
                <input type="text" value={footerBizNum} onChange={(e) => setFooterBizNum(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <button onClick={generateTheme} disabled={isGenerating} className="w-full disabled:bg-gray-400 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg">
              {isGenerating ? '생성 중...' : '✨ 테마 생성하기'}
            </button>
          </div>
        </div>

        {Object.keys(generatedFiles).length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-600">생성된 파일들</h2>
              <button onClick={downloadAsZip} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold">
                📦 ZIP 다운로드
              </button>
            </div>
            <div className="space-y-4">
              {Object.keys(generatedFiles).map(filename => (
                <div key={filename} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-700">{filename}</h3>
                    <button onClick={() => copyFile(filename)} className={`px-3 py-1 rounded text-sm ${copyStatus === filename ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-700'} text-white`}>
                      {copyStatus === filename ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto max-h-60">{generatedFiles[filename]}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 템플릿 생성 함수들은 Part 3, 4에서 제공
// app.jsx에 추가할 템플릿 생성 함수들 - Part 1

// style.css 생성
function generateStyleCSS(themeName, themeSlug) {
  return `/*
Theme Name: ${themeName}
Theme URI: https://example.com
Author: 아로스
Author URI: https://aros100.com
Description: 지원금 전용 워드프레스 테마
Version: 1.0
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: ${themeSlug}
*/

/* ========== 리셋 및 기본 스타일 ========== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html, body {
    height: 100%;
    font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background-color: #ffffff;
}

body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-top: 120px;
}

.site-wrapper {
    flex: 1 0 auto;
}

.container {
    max-width: 768px;
    margin: 0 auto;
    padding: 8px;
}

/* ========== 헤더 고정 스타일 ========== */
.site-header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: white;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-container {
    display: flex;
    align-items: center;
    justify-content: center;
    max-width: 768px;
    margin: 0 auto;
    height: 50px;
    padding: 0 20px;
    gap: 12px;
}

.site-logo img {
    height: 35px;
    width: auto;
    vertical-align: middle;
}

.site-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
}

.site-title a {
    color: inherit;
    text-decoration: none;
}

/* ========== 탭 네비게이션 ========== */
.tab-wrapper {
    position: fixed;
    top: 50px;
    left: 0;
    width: 100%;
    background: white;
    z-index: 999;
    padding: 8px;
    border-bottom: 1px solid #e5e7eb;
}

.tab-container {
    background: white;
    border-radius: 50px;
    padding: 4px;
    margin: 0 auto;
    max-width: 768px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tab-nav {
    display: flex;
    justify-content: space-between;
    list-style: none;
    padding: 0;
    margin: 0;
}

.tab-nav li {
    flex: 1;
    text-align: center;
}

.tab-nav a {
    display: block;
    padding: 12px 8px;
    text-decoration: none;
    color: #6B7280;
    border-radius: 25px;
    transition: all 0.3s ease;
    font-size: 15px;
    font-weight: 600;
}

.tab-nav a:hover {
    color: #3182F6;
    background: #F0F9FF;
}

.tab-nav a.active {
    background: linear-gradient(135deg, #3182F6 0%, #1E6AD4 100%);
    color: white;
    box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
}

/* ========== 인트로 섹션 ========== */
.intro-section {
    text-align: center;
    padding: 32px 20px 24px;
}

.intro-badge {
    display: inline-block;
    background: #cfdefa;
    color: #2f42d4;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 16px;
}

.intro-sub {
    font-size: 25px;
    color: #374151;
    margin-bottom: 8px;
}

.intro-title {
    font-size: 35px;
    font-weight: 800;
    color: #2f42d4;
    letter-spacing: -0.5px;
    margin: 0;
}

/* ========== 정보 박스 ========== */
.info-box {
    background: #F0F9FF;
    border-radius: 16px;
    padding: 24px;
    margin: 20px 0;
    border-left: 4px solid #3182F6;
}

.info-box-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.info-box-icon {
    font-size: 20px;
}

.info-box-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
}

.info-box-amount {
    font-size: 19px;
    font-weight: 700;
    color: #3182F6;
    margin-bottom: 8px;
}

.info-box-desc {
    font-size: 16px;
    color: #6B7280;
    line-height: 1.6;
    margin: 0;
}

/* ========== 카드 그리드 ========== */
.info-card-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    margin-bottom: 30px;
}

.info-card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    text-decoration: none;
    color: inherit;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.04);
}

.info-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 20px 40px rgba(49, 130, 246, 0.15);
}

.info-card-highlight {
    background: linear-gradient(135deg, #3182F6 0%, #1E6AD4 100%);
    padding: 24px 24px 20px;
    position: relative;
}

.info-card.featured .info-card-highlight {
    background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
}

.info-card-badge {
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 10px;
    position: relative;
    overflow: hidden;
}

.info-card-badge::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shine 2s infinite;
}

@keyframes shine {
    0% { left: -100%; }
    50%, 100% { left: 100%; }
}

.info-card-amount {
    font-size: 32px;
    font-weight: 800;
    color: #ffffff;
    letter-spacing: -1px;
    line-height: 1.2;
}

.info-card-amount-sub {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 500;
    margin-top: 6px;
}

.info-card-content {
    padding: 24px;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
}

.info-card-title {
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
    line-height: 1.4;
}

.info-card-desc {
    font-size: 14px;
    color: #71717a;
    line-height: 1.6;
    margin-bottom: 20px;
    flex-grow: 1;
}

.info-card-details {
    background: #F0F9FF;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 20px;
}

.info-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
}

.info-card-row:not(:last-child) {
    border-bottom: 1px dashed #bfdbfe;
    padding-bottom: 10px;
    margin-bottom: 10px;
}

.info-card-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
}

.info-card-value {
    font-size: 13px;
    font-weight: 600;
    color: #1e3a5f;
}

.info-card-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 16px 20px;
    background: linear-gradient(135deg, #3182F6 0%, #1E6AD4 100%);
    color: white;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(49, 130, 246, 0.3);
}

.info-card-btn:hover {
    background: linear-gradient(135deg, #1E6AD4 0%, #1556B0 100%);
    transform: translateY(-2px);
}

/* ========== 광고 카드 ========== */
.ad-card {
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(0, 0, 0, 0.04);
    padding: 16px;
    margin: 24px 0;
    text-align: center;
}

/* ========== 히어로 섹션 ========== */
.hero-section {
    background: linear-gradient(135deg, #2563EB 0%, #3182F6 50%, #0EA5E9 100%);
    border-radius: 24px;
    padding: 40px 32px;
    margin: 32px 0;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.hero-section::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
}

.hero-urgent {
    display: inline-block;
    background: rgba(255, 255, 255, 0.95);
    color: #DC2626;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 20px;
}

.hero-sub {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 8px;
}

.hero-title {
    font-size: 32px;
    font-weight: 800;
    color: white;
    line-height: 1.3;
    margin-bottom: 8px;
}

.hero-highlight {
    color: #FDE047;
}

.hero-amount {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 28px;
}

.hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: white;
    color: #2563EB;
    padding: 18px 40px;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;
}

.hero-cta:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

/* ========== 푸터 ========== */
.site-footer {
    flex-shrink: 0;
    background: #E3F2FD;
    color: #333;
    padding: 30px 20px;
    margin-top: 50px;
}

.footer-content {
    max-width: 768px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
}

.footer-brand {
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 8px;
    color: #1976D2;
}

.footer-info {
    list-style: none;
    padding: 0;
    margin: 0;
}

.footer-info li {
    margin-bottom: 4px;
    color: #666;
    font-size: 0.9rem;
}

.footer-right {
    text-align: right;
}

.footer-right p {
    margin-bottom: 4px;
    font-size: 0.9rem;
}

.footer-right a {
    color: #1976D2;
    text-decoration: none;
}

.footer-copyright {
    color: #999;
    font-size: 0.85rem;
    margin-top: 10px;
}

/* ========== 이탈방지 팝업 ========== */
.exit-popup-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    justify-content: center;
    align-items: center;
}

.exit-popup-overlay.active {
    display: flex;
}

.exit-popup {
    background: #ffffff;
    border-radius: 20px;
    padding: 30px;
    max-width: 340px;
    text-align: center;
    animation: popIn 0.3s ease;
}

@keyframes popIn {
    0% { transform: scale(0.8); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
}

.exit-popup-title {
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 12px;
}

.exit-popup-desc {
    font-size: 14px;
    color: #666;
    margin-bottom: 20px;
    line-height: 1.5;
}

.exit-popup-btn {
    display: block;
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #3182F6 0%, #1E6AD4 100%);
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 10px;
}

.exit-popup-close {
    background: none;
    border: none;
    color: #999;
    font-size: 13px;
    cursor: pointer;
}

/* ========== 반응형 ========== */
@media (max-width: 768px) {
    .info-card-grid {
        grid-template-columns: 1fr;
        gap: 20px;
    }
    
    .footer-content {
        flex-direction: column;
        gap: 20px;
        text-align: center;
    }
    
    .footer-right {
        text-align: center;
    }
    
    .tab-nav a {
        font-size: 13px;
        padding: 10px 6px;
    }
    
    .hero-title {
        font-size: 26px;
    }
    
    .intro-title {
        font-size: 28px;
    }
}

@media (max-width: 480px) {
    body {
        padding-top: 110px;
    }
    
    .ad-card {
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
    }
}

// app.jsx에 추가할 템플릿 생성 함수들 - Part 2

// header.php 생성
function generateHeaderPHP(title, tabs, tabLinks, adCode, mainUrl) {
  let pubId = '';
  let headerAdScript = '';
  
  if (adCode.trim()) {
    const pubMatch = adCode.match(/data-ad-client=["']([^"']+)["']/);
    if (pubMatch) pubId = pubMatch[1];
    headerAdScript = `<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}"></script>`;
  }

  const tabsHTML = tabs.map((tab, i) => {
    if (!tab.trim()) return '';
    const link = tabLinks[i] || mainUrl || home_url('/');
    return `                <li><a href="${link}"${i === 0 ? ' class="active"' : ''}>${tab}</a></li>`;
  }).filter(t => t).join('\n');

  return `<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${headerAdScript}
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<div class="site-wrapper">
    <header class="site-header">
        <div class="header-container">
            <?php if (has_custom_logo()) : ?>
                <div class="site-logo">
                    <?php the_custom_logo(); ?>
                </div>
            <?php endif; ?>
            <h1 class="site-title">
                <a href="<?php echo esc_url(home_url('/')); ?>">${title}</a>
            </h1>
        </div>
    </header>

    <div class="tab-wrapper">
        <nav class="tab-container">
            <ul class="tab-nav">
${tabsHTML}
            </ul>
        </nav>
    </div>`;
}

// footer.php 생성
function generateFooterPHP(footerBrand, footerAddress, footerBizNum) {
  return `    <footer class="site-footer">
        <div class="footer-content">
            <div class="footer-left">
                <div class="footer-brand">${footerBrand}</div>
                <ul class="footer-info">
                    <li>📍 ${footerAddress}</li>
                    <li>🏢 사업자 번호: ${footerBizNum}</li>
                </ul>
            </div>
            <div class="footer-right">
                <p>제작자 : 아로스</p>
                <p>홈페이지 : <a href="https://aros100.com" target="_blank">바로가기</a></p>
                <p class="footer-copyright">Copyrights © <?php echo date('Y'); ?> All Rights Reserved by (주)아백</p>
            </div>
        </div>
    </footer>
</div>

<?php wp_footer(); ?>
</body>
</html>`;
}

// index.php 생성
function generateIndexPHP(cardData, mainUrl, adCode) {
  let pubId = '';
  let adSlot = '';
  let displayAdCode = '';
  let adHTML = '';
  
  if (adCode.trim()) {
    const pubMatch = adCode.match(/data-ad-client=["']([^"']+)["']/);
    const slotMatch = adCode.match(/data-ad-slot=["']([^"']+)["']/);
    if (pubMatch) pubId = pubMatch[1];
    if (slotMatch) adSlot = slotMatch[1];
    
    displayAdCode = `<div class="ad-display">
${adCode.trim()}
</div>`;

    if (pubId && adSlot) {
      const fixedAdCode = `<script async crossorigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}"></script>
<ins class="adsbygoogle" data-ad-client="${pubId}" data-ad-slot="${adSlot}" style="display:inline-block;width:336px;height:280px;"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`;
      
      adHTML = `    <div class="ad-card">
        <div style="display:flex; justify-content:center; width:100%;">
            ${fixedAdCode}
        </div>    
    </div>`;
    }
  } else {
    displayAdCode = '<!-- 애드센스 코드를 입력하지 않았습니다 -->';
  }

  let cardsHTML = '';
  cardData.forEach((c, idx) => {
    if (adHTML && (idx === 0 || idx === 3 || idx === 6)) {
      cardsHTML += adHTML + '\n';
    }
    
    const featured = idx === 0 ? ' featured' : '';
    const badge = idx === 0 ? `            <span class="info-card-badge">🔥 인기</span>\n` : '';
    cardsHTML += `
    <a class="info-card${featured}" href="${mainUrl}">
        <div class="info-card-highlight">
${badge}            <div class="info-card-amount">${c.amount}</div>
            <div class="info-card-amount-sub">${c.amountSub}</div>
        </div>
        <div class="info-card-content">
            <h3 class="info-card-title">${c.keyword}</h3>
            <p class="info-card-desc">${c.description}</p>
            <div class="info-card-details">
                <div class="info-card-row">
                    <span class="info-card-label">지원대상</span>
                    <span class="info-card-value">${c.target}</span>
                </div>
                <div class="info-card-row">
                    <span class="info-card-label">신청시기</span>
                    <span class="info-card-value">${c.period}</span>
                </div>
            </div>
            <div class="info-card-btn">
                지금 바로 신청하기 <span class="btn-arrow">→</span>
            </div>
        </div>
    </a>
`;
  });

  return `<?php get_header(); ?>

<div class="container">
    <!-- 이탈 방지 팝업 -->
    <div class="exit-popup-overlay" id="exitPopup">
        <div class="exit-popup">
            <div class="exit-popup-title">🎁 잠깐! 놓치신 혜택이 있어요</div>
            <div class="exit-popup-desc">
                지금 확인 안 하면<br>
                <strong>최대 300만원</strong> 지원금을 못 받을 수 있어요!
            </div>
            <button class="exit-popup-btn" onclick="closePopupAndScroll()">
                내 지원금 확인하기 →
            </button>
            <button class="exit-popup-close" onclick="closePopupNotNow()">
                다음에 할게요
            </button>
        </div>
    </div>

    <!-- 인트로 섹션 -->
    <div class="intro-section">
        <span class="intro-badge">신청마감 D-3일</span>
        <p class="intro-sub">숨은 보험금 1분만에 찾기!</p>
        <h2 class="intro-title">숨은 지원금 찾기</h2>
    </div>

    <!-- 애드센스 광고 -->
    ${displayAdCode}

    <!-- 정보 박스 -->
    <div class="info-box">
        <div class="info-box-header">
            <span class="info-box-icon">🏷️</span>
            <span class="info-box-title">신청 안하면 절대 못 받아요</span>
        </div>
        <div class="info-box-amount">1인 평균 127만원 환급</div>
        <p class="info-box-desc">대한민국 92%가 놓치고 있는 정부 지원금! 지금 확인하고 혜택 놓치지 마세요.</p>
    </div>

    <!-- 카드 그리드 -->
    <div class="info-card-grid">
${cardsHTML}
    </div>

    <!-- 히어로 섹션 -->
    <div class="hero-section">
        <div class="hero-content">
            <span class="hero-urgent">🔥 신청마감 D-3일</span>
            <p class="hero-sub">숨은 지원금 1분만에 찾기!</p>
            <h2 class="hero-title">
                나의 <span class="hero-highlight">숨은 지원금</span> 찾기
            </h2>
            <p class="hero-amount">신청자 <strong>1인 평균 127만원</strong> 수령</p>
            <a class="hero-cta" href="${mainUrl}">
                30초만에 내 지원금 확인 <span class="cta-arrow">→</span>
            </a>
            <div class="hero-notice" style="background: rgba(255, 255, 255, 0.15); backdrop-filter: blur(8px); border-radius: 12px; padding: 16px 20px; margin-top: 24px; text-align: left;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                    <span style="font-size: 18px;">💡</span>
                    <span style="font-size: 14px; font-weight: 700; color: white;">신청 안하면 못 받아요</span>
                </div>
                <p style="font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin: 0;">대한민국 92%가 놓치고 있는 정부 지원금, 지금 확인하고 혜택 놓치지 마세요!</p>
            </div>
        </div>
    </div>
</div>

<?php get_footer(); ?>`;
}

  //functions.php 생성
function generateFunctionsPHP(themeSlug) {
  return `<?php
/**
 * Theme Functions
 */

if (!defined('ABSPATH')) {
    exit;
}

// 테마 설정
function ${themeSlug.replace(/-/g, '_')}_setup() {
    // 타이틀 태그 지원
    add_theme_support('title-tag');
    
    // 커스텀 로고 지원
    add_theme_support('custom-logo', array(
        'height'      => 100,
        'width'       => 400,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Featured Image 지원
    add_theme_support('post-thumbnails');
    
    // HTML5 지원
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
}
add_action('after_setup_theme', '${themeSlug.replace(/-/g, '_')}_setup');

// 스타일시트 및 스크립트 로드
function ${themeSlug.replace(/-/g, '_')}_scripts() {
    // 메인 스타일시트
    wp_enqueue_style('${themeSlug}-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // 커스텀 자바스크립트
    wp_enqueue_script('${themeSlug}-custom', get_template_directory_uri() . '/custom.js', array(), '1.0.0', true);
    
    // Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap', array(), null);
}
add_action('wp_enqueue_scripts', '${themeSlug.replace(/-/g, '_')}_scripts');

// 메뉴 등록
function ${themeSlug.replace(/-/g, '_')}_menus() {
    register_nav_menus(array(
        'primary' => __('Primary Menu', '${themeSlug}'),
    ));
}
add_action('init', '${themeSlug.replace(/-/g, '_')}_menus');

// 위젯 영역 등록
function ${themeSlug.replace(/-/g, '_')}_widgets_init() {
    register_sidebar(array(
        'name'          => __('Sidebar', '${themeSlug}'),
        'id'            => 'sidebar-1',
        'description'   => __('Add widgets here.', '${themeSlug}'),
        'before_widget' => '<section id="%1$s" class="widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h2 class="widget-title">',
        'after_title'   => '</h2>',
    ));
}
add_action('widgets_init', '${themeSlug.replace(/-/g, '_')}_widgets_init');

// 발췌문 길이 설정
function ${themeSlug.replace(/-/g, '_')}_excerpt_length($length) {
    return 20;
}
add_filter('excerpt_length', '${themeSlug.replace(/-/g, '_')}_excerpt_length');

// 발췌문 더보기 텍스트
function ${themeSlug.replace(/-/g, '_')}_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', '${themeSlug.replace(/-/g, '_')}_excerpt_more');

// 커스터마이저 설정
function ${themeSlug.replace(/-/g, '_')}_customize_register($wp_customize) {
    // 사이트 정보 섹션에 설정 추가
    $wp_customize->add_setting('header_title', array(
        'default'           => '지원금 스킨',
        'sanitize_callback' => 'sanitize_text_field',
    ));
    
    $wp_customize->add_control('header_title', array(
        'label'    => __('Header Title', '${themeSlug}'),
        'section'  => 'title_tagline',
        'type'     => 'text',
    ));
}
add_action('customize_register', '${themeSlug.replace(/-/g, '_')}_customize_register');

// 보안: 버전 정보 제거
remove_action('wp_head', 'wp_generator');

// 성능: 이모지 스크립트 제거
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

// JPEG 품질 향상
add_filter('jpeg_quality', function() { return 90; });`;
}

// custom.js 생성
function generateCustomJS() {
  return `/**
 * Custom JavaScript for Support Funds Theme
 */

(function() {
    'use strict';

    // 이탈 방지 팝업 관리
    let popupShown = sessionStorage.getItem('exitPopupShown');
    let closeCount = parseInt(sessionStorage.getItem('exitPopupCloseCount')) || 0;
    let scrollTriggered = false;

    window.addEventListener('load', function() {
        const popup = document.getElementById('exitPopup');
        if (!popup) return;

        // PC: 마우스 이탈 감지
        document.addEventListener('mouseout', function(e) {
            e = e || window.event;
            const y = e.clientY;
            if (y < 0 && !popupShown && closeCount < 2) {
                showPopup();
            }
        });

        // PC + 모바일: 뒤로가기 감지
        history.pushState(null, '', location.href);
        window.addEventListener('popstate', function() {
            if (closeCount < 2) {
                showPopup();
            }
            history.pushState(null, '', location.href);
        });

        // 모바일: 스크롤 60% 도달 시
        window.addEventListener('scroll', function() {
            const h = document.body.scrollHeight - window.innerHeight;
            const percent = (window.scrollY / h) * 100;
            
            if (percent > 60 && !popupShown && !scrollTriggered && closeCount < 2) {
                showPopup();
                scrollTriggered = true;
            }
        });
    });

    function showPopup() {
        const popup = document.getElementById('exitPopup');
        if (popup) {
            popup.classList.add('active');
        }
    }

    function closePopup() {
        const popup = document.getElementById('exitPopup');
        if (popup) {
            popup.classList.remove('active');
        }
    }

    window.closePopupAndScroll = function() {
        closePopup();
        const hero = document.querySelector('.hero-section');
        if (hero) {
            hero.scrollIntoView({ behavior: 'smooth' });
        }
    };

    window.closePopupNotNow = function() {
        closePopup();
        popupShown = true;
        closeCount++;
        sessionStorage.setItem('exitPopupShown', 'true');
        sessionStorage.setItem('exitPopupCloseCount', closeCount);
    };

    // 탭 네비게이션 활성화
    document.addEventListener('DOMContentLoaded', function() {
        const tabs = document.querySelectorAll('.tab-nav a');
        const currentUrl = window.location.href;
        
        tabs.forEach(function(tab) {
            if (tab.href === currentUrl) {
                tabs.forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
            }
        });
    });

    // 스무스 스크롤
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

})();`;
}

// app.jsx의 WPThemeGenerator 컴포넌트 내부에 이 함수들을 추가하세요
// 이미 Part 2에서 generateTheme 함수 내에서 호출되고 있습니다
              
ReactDOM.render(<WPThemeGenerator />, document.getElementById('root'));
