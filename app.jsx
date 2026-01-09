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

ReactDOM.render(<WPThemeGenerator />, document.getElementById('root'));
