// ========================================
// AI構文チェッカー - ルールベース検出エンジン
// ========================================

// --- 検出パターン定義 ---

const PATTERNS = {
  // ① 断定型テンプレ
  assertive: {
    label: '断定型テンプレ',
    icon: 'orange',
    emoji: '&#x1F4A2;',
    patterns: [
      { regex: /だから.{1,20}である。/g, desc: '「〜だから〜である。」構文' },
      { regex: /本質は.{1,30}だ[。！]/g, desc: '「本質は〜だ。」構文' },
      { regex: /実は.{1,40}なのです[。！]/g, desc: '「実は〜なのです。」構文' },
      { regex: /つまり.{1,40}ということです[。！]?/g, desc: '「つまり〜ということです」' },
      { regex: /言い換えれば.{1,40}です[。！]?/g, desc: '「言い換えれば〜です」' },
      { regex: /(?:一言で|端的に)言えば/g, desc: '「一言で言えば」「端的に言えば」' },
      { regex: /間違いありません/g, desc: '「間違いありません」' },
      { regex: /(?:これは|それは).{0,20}に他なりません/g, desc: '「〜に他なりません」' },
      { regex: /(?:紛れもない|紛れもなく)/g, desc: '「紛れもない」' },
    ]
  },

  // ② 三段展開・構成テンプレ
  structure: {
    label: '三段構成・テンプレ展開',
    icon: 'blue',
    emoji: '&#x1F4D0;',
    patterns: [
      { regex: /結論から[言い申](?:う|し[まます])[すと]/g, desc: '「結論から言います」' },
      { regex: /まず.{1,60}(?:次に|そして|さらに)/g, desc: '「まず〜、次に〜」の三段構成' },
      { regex: /第[一二三]に/g, desc: '「第一に、第二に」のナンバリング' },
      { regex: /(?:ポイント|理由)は[以下の]*[3３三つ]/g, desc: '「ポイントは3つ」' },
      { regex: /(?:1つ目|2つ目|3つ目|一つ目|二つ目|三つ目)(?:は|の)/g, desc: '「1つ目は〜」のナンバリング' },
      { regex: /順番に(?:見て|解説|説明|紹介)/g, desc: '「順番に見ていきましょう」' },
      { regex: /(?:以上を|これらを)踏まえ/g, desc: '「以上を踏まえ〜」' },
      { regex: /(?:最後に|まとめると)/g, desc: '「最後に」「まとめると」' },
    ]
  },

  // ③ 過剰な丁寧・教科書的接続詞
  connectors: {
    label: '接続詞・教科書感',
    icon: 'yellow',
    emoji: '&#x1F4DA;',
    patterns: [
      { regex: /そのため[、,]/g, desc: '「そのため、」' },
      { regex: /したがって[、,]/g, desc: '「したがって、」' },
      { regex: /一方で[、,]/g, desc: '「一方で、」' },
      { regex: /また[、,]/g, desc: '「また、」' },
      { regex: /さらに[、,]/g, desc: '「さらに、」' },
      { regex: /加えて[、,]/g, desc: '「加えて、」' },
      { regex: /ただし[、,]/g, desc: '「ただし、」' },
      { regex: /もちろん[、,]/g, desc: '「もちろん、」' },
      { regex: /(?:ちなみに|なお)[、,]/g, desc: '「ちなみに、」「なお、」' },
      { regex: /(?:具体的に|特に)は[、,]?/g, desc: '「具体的には、」「特には、」' },
      { regex: /(?:つまり|すなわち)[、,]/g, desc: '「つまり、」「すなわち、」' },
      { regex: /(?:要するに)[、,]?/g, desc: '「要するに」' },
      { regex: /(?:いずれにしても|いずれにせよ)/g, desc: '「いずれにしても」' },
    ]
  },

  // ④ 感情の嘘臭さ・曖昧丁寧表現
  fakeEmotion: {
    label: '感情の嘘臭さ',
    icon: 'purple',
    emoji: '&#x1F3AD;',
    patterns: [
      { regex: /とても大切です/g, desc: '「とても大切です」' },
      { regex: /と言えるでしょう/g, desc: '「〜と言えるでしょう」' },
      { regex: /なのではないでしょうか/g, desc: '「〜なのではないでしょうか」' },
      { regex: /ではないかと(?:思い|考え)ます/g, desc: '「〜ではないかと思います」' },
      { regex: /かもしれません(?:ね)?/g, desc: '「〜かもしれません」' },
      { regex: /(?:非常に|とても|大変)(?:重要|大切|有益|興味深い)/g, desc: '「非常に重要」「とても有益」系' },
      { regex: /心から(?:願|祈|思)/g, desc: '「心から願っています」' },
      { regex: /ぜひ.{0,15}(?:てみてください|をおすすめ)/g, desc: '「ぜひ〜てみてください」' },
      { regex: /(?:素晴らしい|すばらしい)(?:です|と思い)/g, desc: '「素晴らしいです」' },
      { regex: /参考にな(?:れば|ると)(?:幸い|嬉しい|思い)/g, desc: '「参考になれば幸いです」' },
    ]
  },

  // ⑤ AI頻出フレーズ
  aiPhrases: {
    label: 'AI頻出フレーズ',
    icon: 'red',
    emoji: '&#x1F916;',
    patterns: [
      { regex: /それ、.{1,20}です[。！]?/g, desc: '「それ、〜です」' },
      { regex: /これ、.{1,20}です[。！]?/g, desc: '「これ、〜です」' },
      { regex: /(?:^|[。！？\n])(?:　|\s)*これ、/gm, desc: '文頭の「これ、」', weight: 0.3 },
      { regex: /(?:^|[。！？\n])(?:　|\s)*ここ、/gm, desc: '文頭の「ここ、」', weight: 0.3 },
      { regex: /することができます/g, desc: '「〜することができます」' },
      { regex: /と考えられます/g, desc: '「〜と考えられます」' },
      { regex: /結論として/g, desc: '「結論として」' },
      { regex: /されがちです/g, desc: '「〜されがちです」' },
      { regex: /(?:していきましょう|してみましょう)/g, desc: '「〜していきましょう」' },
      { regex: /(?:について|に関して)(?:解説|説明|紹介)(?:します|していきます)/g, desc: '「〜について解説します」' },
      { regex: /(?:のメリット|のデメリット)(?:は|として)/g, desc: '「〜のメリットは」' },
      { regex: /(?:を踏まえた上で|を踏まえて)/g, desc: '「〜を踏まえた上で」' },
      { regex: /(?:と言っても過言ではありません|と言っても過言ではない)/g, desc: '「〜と言っても過言ではありません」' },
      { regex: /一つずつ(?:見て|確認して|解説して)/g, desc: '「一つずつ見ていきましょう」' },
      { regex: /(?:おすすめ|オススメ)(?:です|します)/g, desc: '「おすすめです」' },
      { regex: /知っておきたい/g, desc: '「知っておきたい」' },
      { regex: /押さえておきたい/g, desc: '「押さえておきたい」' },
      { regex: /意識(?:する|して)(?:こと|べき|ましょう)/g, desc: '「意識することが〜」' },
    ]
  },
};

// --- 文体分析ルール ---

const STYLE_CHECKS = {
  // 「〜です。」の連続
  desuChain: {
    label: '「〜です。」の連続',
    category: 'connectors',
    icon: 'yellow',
    check(text) {
      const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
      const matches = [];
      let consecutive = 0;
      let start = -1;
      for (let i = 0; i < sentences.length; i++) {
        const s = sentences[i].trim();
        if (/です$/.test(s)) {
          if (consecutive === 0) start = i;
          consecutive++;
        } else {
          if (consecutive >= 3) {
            const chain = sentences.slice(start, start + consecutive).map(x => x.trim() + '。');
            matches.push({
              text: chain.join(' '),
              desc: `${consecutive}文連続で「〜です。」で終了`
            });
          }
          consecutive = 0;
        }
      }
      if (consecutive >= 3) {
        const chain = sentences.slice(start, start + consecutive).map(x => x.trim() + '。');
        matches.push({
          text: chain.join(' '),
          desc: `${consecutive}文連続で「〜です。」で終了`
        });
      }
      return matches;
    }
  },

  // 文末が必ず読点「。」で終わる（バリエーション不足）
  uniformEndings: {
    label: '文末バリエーション不足',
    category: 'connectors',
    icon: 'yellow',
    check(text) {
      const sentences = text.split(/\n/).filter(s => s.trim().length > 5);
      if (sentences.length < 5) return [];
      let periodEndings = 0;
      sentences.forEach(s => {
        if (/[。]$/.test(s.trim())) periodEndings++;
      });
      const ratio = periodEndings / sentences.length;
      if (ratio > 0.9 && sentences.length >= 5) {
        return [{
          text: `全${sentences.length}文中${periodEndings}文が「。」で終了 (${Math.round(ratio * 100)}%)`,
          desc: '文末がほぼ全て「。」で統一されすぎ'
        }];
      }
      return [];
    }
  },

  // 句読点の間隔が均一すぎる
  uniformPunctuation: {
    label: '句読点の間隔が均一',
    category: 'structure',
    icon: 'blue',
    check(text) {
      const segments = text.split(/[。、！？]/).filter(s => s.trim().length > 0);
      if (segments.length < 6) return [];
      const lengths = segments.map(s => s.trim().length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / avg;
      if (cv < 0.3 && avg > 5) {
        return [{
          text: `句読点間の平均文字数: ${Math.round(avg)}文字 (変動係数: ${cv.toFixed(2)})`,
          desc: '句読点の間隔が均一すぎる。人間の文章はもっとバラつく'
        }];
      }
      return [];
    }
  },

  // **太字** や " " の装飾
  decorations: {
    label: 'マークダウン装飾の多用',
    category: 'aiPhrases',
    icon: 'red',
    check(text) {
      const matches = [];
      const boldMatches = text.match(/\*\*[^*]+\*\*/g);
      if (boldMatches && boldMatches.length >= 2) {
        matches.push({
          text: boldMatches.slice(0, 5).join('、'),
          desc: `**太字**の使用: ${boldMatches.length}箇所`
        });
      }
      const quoteMatches = text.match(/"[^"]+"/g);
      if (quoteMatches && quoteMatches.length >= 1) {
        matches.push({
          text: quoteMatches.slice(0, 5).join('、'),
          desc: `""引用符の使用: ${quoteMatches.length}箇所`
        });
      }
      const bracketMatches = text.match(/「[^」]+」/g);
      if (bracketMatches && bracketMatches.length >= 6) {
        matches.push({
          text: `「」の使用: ${bracketMatches.length}箇所`,
          desc: '「」カギ括弧が多い。AI生成文に頻出のパターン'
        });
      }
      return matches;
    }
  },

  // 段落の長さが均一
  uniformParagraphs: {
    label: '段落の長さが均一',
    category: 'structure',
    icon: 'blue',
    check(text) {
      const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
      if (paragraphs.length < 3) return [];
      const lengths = paragraphs.map(p => p.trim().length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
      const cv = Math.sqrt(variance) / avg;
      if (cv < 0.25 && paragraphs.length >= 3) {
        return [{
          text: `${paragraphs.length}段落の平均: ${Math.round(avg)}文字 (変動係数: ${cv.toFixed(2)})`,
          desc: '段落の長さが均一すぎる。人間は段落の長短にムラがある'
        }];
      }
      return [];
    }
  },

  // リスト・箇条書きの多用
  listOveruse: {
    label: '箇条書き・リストの多用',
    category: 'structure',
    icon: 'blue',
    check(text) {
      const listLines = text.split('\n').filter(l => /^\s*[\-\・\•\*\d+[.．)）]\s]/.test(l));
      const totalLines = text.split('\n').filter(l => l.trim().length > 0).length;
      if (listLines.length >= 4 && listLines.length / totalLines > 0.3) {
        return [{
          text: `箇条書き行: ${listLines.length}/${totalLines}行 (${Math.round(listLines.length / totalLines * 100)}%)`,
          desc: '箇条書きの割合が高い。AI生成文に多いパターン'
        }];
      }
      return [];
    }
  },

  // 人間ノイズの少なさ（口語・感嘆・くだけた表現が少ない）
  humanNoise: {
    label: '人間ノイズの少なさ',
    category: 'fakeEmotion',
    icon: 'purple',
    check(text) {
      if (text.length < 100) return [];
      const noisePatterns = [
        /[笑w]/g, /[！？]{2,}/g, /…{1,}/g,
        /ちょっと/g, /めっちゃ/g, /マジで/g, /やっぱ(?:り)?/g,
        /なんか/g, /ってか/g, /けど$/gm, /だけど$/gm,
        /かな[ぁ〜]?$/gm, /だよね/g, /よね/g, /でしょ[？]?$/gm,
        /[〜～]/g, /[ーっ]{2,}/g
      ];
      let noiseCount = 0;
      noisePatterns.forEach(p => {
        const m = text.match(p);
        if (m) noiseCount += m.length;
      });
      const ratio = noiseCount / (text.length / 100);
      if (ratio < 0.5) {
        return [{
          text: `人間ノイズ指数: ${ratio.toFixed(1)} (100文字あたり)`,
          desc: '口語表現や感嘆詞が少なく、整いすぎている'
        }];
      }
      return [];
    }
  },

  // 同じ語尾の繰り返し（ます。ます。ます。）
  endingRepetition: {
    label: '語尾の繰り返し',
    category: 'connectors',
    icon: 'yellow',
    check(text) {
      const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 3);
      if (sentences.length < 4) return [];
      const matches = [];
      const endings = sentences.map(s => {
        const t = s.trim();
        const m = t.match(/(ます|です|ました|でした|ません|でしょう|ください)$/);
        return m ? m[1] : null;
      });

      let run = 1;
      for (let i = 1; i < endings.length; i++) {
        if (endings[i] && endings[i] === endings[i - 1]) {
          run++;
        } else {
          if (run >= 3) {
            matches.push({
              text: `「〜${endings[i - 1]}」が${run}回連続`,
              desc: `同じ語尾が連続しすぎ`
            });
          }
          run = 1;
        }
      }
      if (run >= 3 && endings[endings.length - 1]) {
        matches.push({
          text: `「〜${endings[endings.length - 1]}」が${run}回連続`,
          desc: `同じ語尾が連続しすぎ`
        });
      }
      return matches;
    }
  },

  // タイトルのAI臭さ
  titleAI: {
    label: 'タイトルのAI臭さ',
    category: 'aiPhrases',
    icon: 'red',
    checkTitle(title) {
      if (!title || title.trim().length === 0) return [];
      const matches = [];
      const titlePatterns = [
        { regex: /【.+】/g, desc: '【】隅付き括弧' },
        { regex: /[〜～].{1,10}[！!]/g, desc: '「〜○○！」パターン' },
        { regex: /(?:徹底|完全)(?:解説|ガイド|比較|網羅)/g, desc: '「徹底解説」「完全ガイド」' },
        { regex: /(?:知っておきたい|押さえておきたい|知らないと損)/g, desc: '「知っておきたい」系' },
        { regex: /\d+選/g, desc: '「○選」' },
        { regex: /(?:まとめ|一覧|保存版)/g, desc: '「まとめ」「一覧」「保存版」' },
        { regex: /(?:必見|必読|永久保存)/g, desc: '「必見」「必読」' },
        { regex: /(?:初心者|入門|基礎)(?:向け|でも|から)/g, desc: '「初心者向け」系' },
        { regex: /(?:とは[？?]?$)/g, desc: '「〜とは？」' },
      ];
      titlePatterns.forEach(p => {
        const m = title.match(p.regex);
        if (m) {
          m.forEach(matched => {
            matches.push({
              text: matched,
              desc: p.desc
            });
          });
        }
      });
      return matches;
    }
  }
};

// --- スコアリング ---

function calculateScore(allResults) {
  let totalWeight = 0;

  const categoryWeights = {
    assertive: 3,
    structure: 2.5,
    connectors: 1.5,
    fakeEmotion: 2,
    aiPhrases: 3,
  };

  Object.keys(allResults).forEach(cat => {
    const items = allResults[cat];
    const baseW = categoryWeights[cat] || 2;
    let catScore = 0;
    items.forEach(item => {
      const itemWeight = item.weight !== undefined ? item.weight : 1;
      catScore += baseW * itemWeight;
    });
    totalWeight += Math.min(catScore, 25);
  });

  // 0-100にマップ（50前後で飽和しないよう調整）
  const raw = Math.min(totalWeight / 40 * 100, 100);
  return Math.round(raw);
}

function getLevelLabel(count, thresholds) {
  if (count === 0) return { text: '検出なし', level: 'none' };
  if (count <= thresholds[0]) return { text: '少なめ', level: 'low' };
  if (count <= thresholds[1]) return { text: 'やや多い', level: 'mid' };
  return { text: '多め', level: 'high' };
}

function getScoreComment(score) {
  if (score <= 15) return 'ほぼ人間っぽい文章です。自然体でいい感じ！';
  if (score <= 30) return '少しだけAIの影が見えるかも？　でも十分自然です。';
  if (score <= 50) return 'ところどころAIっぽい表現がありますね。ちょっと手を入れると良さそう。';
  if (score <= 70) return 'かなりAIっぽさが漂っています。リライトをおすすめします！';
  return 'これは…AIが書いた感がかなり強いです。大幅にリライトしましょう！';
}

// --- メイン診断関数 ---

function runDiagnosis() {
  const title = document.getElementById('title-input').value.trim();
  const body = document.getElementById('body-input').value.trim();

  if (!body && !title) {
    alert('本文またはタイトルを入力してください。');
    return;
  }

  const fullText = body;
  const allResults = {
    assertive: [],
    structure: [],
    connectors: [],
    fakeEmotion: [],
    aiPhrases: [],
  };

  // パターンマッチ
  Object.keys(PATTERNS).forEach(catKey => {
    const cat = PATTERNS[catKey];
    cat.patterns.forEach(p => {
      // Reset regex lastIndex
      p.regex.lastIndex = 0;
      let match;
      while ((match = p.regex.exec(fullText)) !== null) {
        const start = Math.max(0, match.index - 10);
        const end = Math.min(fullText.length, match.index + match[0].length + 10);
        const before = fullText.substring(start, match.index);
        const after = fullText.substring(match.index + match[0].length, end);
        const item = {
          text: match[0],
          context: { before, after },
          desc: p.desc
        };
        if (p.weight !== undefined) item.weight = p.weight;
        allResults[catKey].push(item);
      }
    });
  });

  // 文体チェック
  Object.keys(STYLE_CHECKS).forEach(key => {
    const check = STYLE_CHECKS[key];
    let results = [];
    if (check.check) results = check.check(fullText);
    if (check.checkTitle) results = results.concat(check.checkTitle(title));
    const cat = check.category;
    if (allResults[cat]) {
      results.forEach(r => allResults[cat].push(r));
    }
  });

  // スコア計算
  const score = calculateScore(allResults);

  // 結果表示
  renderResults(score, allResults);
}

// --- 結果レンダリング ---

function renderResults(score, allResults) {
  const section = document.getElementById('result-section');
  section.classList.remove('hidden');

  // スコア
  const scoreNum = document.getElementById('score-number');
  const scoreCircle = document.getElementById('score-circle');
  const scoreComment = document.getElementById('score-comment');

  scoreCircle.className = 'score-circle';
  if (score <= 30) scoreCircle.classList.add('score-low');
  else if (score <= 60) scoreCircle.classList.add('score-mid');
  else scoreCircle.classList.add('score-high');

  // アニメーション
  animateScore(scoreNum, score);
  scoreComment.textContent = getScoreComment(score);

  // カテゴリサマリー
  const summaryEl = document.getElementById('category-summary');
  const categories = [
    { key: 'assertive', label: '断定型', thresholds: [2, 5] },
    { key: 'structure', label: '三段構成', thresholds: [1, 3] },
    { key: 'connectors', label: '接続詞・文末', thresholds: [4, 8] },
    { key: 'fakeEmotion', label: '感情表現', thresholds: [2, 5] },
  ];

  summaryEl.innerHTML = categories.map(c => {
    const count = allResults[c.key].length;
    const lv = getLevelLabel(count, c.thresholds);
    return `
      <div class="category-card">
        <div class="cat-label">${c.label}</div>
        <div class="cat-value level-${lv.level}">${lv.text}${count > 0 ? ` (${count}件)` : ''}</div>
      </div>
    `;
  }).join('');

  // 詳細
  const detailsEl = document.getElementById('details');
  const groupDefs = [
    { key: 'aiPhrases', label: PATTERNS.aiPhrases.label, icon: PATTERNS.aiPhrases.icon, emoji: PATTERNS.aiPhrases.emoji },
    { key: 'assertive', label: PATTERNS.assertive.label, icon: PATTERNS.assertive.icon, emoji: PATTERNS.assertive.emoji },
    { key: 'structure', label: PATTERNS.structure.label, icon: PATTERNS.structure.icon, emoji: PATTERNS.structure.emoji },
    { key: 'connectors', label: PATTERNS.connectors.label, icon: PATTERNS.connectors.icon, emoji: PATTERNS.connectors.emoji },
    { key: 'fakeEmotion', label: PATTERNS.fakeEmotion.label, icon: PATTERNS.fakeEmotion.icon, emoji: PATTERNS.fakeEmotion.emoji },
  ];

  detailsEl.innerHTML = groupDefs.map(g => {
    const items = allResults[g.key];
    if (items.length === 0) return '';

    const itemsHtml = items.map(item => {
      let textHtml = '';
      if (item.context) {
        textHtml = `<span class="context">${escapeHtml(item.context.before)}</span><span class="matched">${escapeHtml(item.text)}</span><span class="context">${escapeHtml(item.context.after)}</span>`;
      } else {
        textHtml = `<span class="matched">${escapeHtml(item.text)}</span>`;
      }
      return `
        <div class="detail-item">
          <div class="match-icon ${g.icon}">!</div>
          <div class="match-text">
            <div>${textHtml}</div>
            <div class="context" style="font-size:12px; margin-top:2px;">${escapeHtml(item.desc)}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="detail-group open">
        <div class="detail-group-header" onclick="toggleGroup(this)">
          <span>${g.emoji} ${g.label}</span>
          <span class="detail-count">${items.length}件</span>
          <span class="arrow">&#x25B6;</span>
        </div>
        <div class="detail-group-body">
          ${itemsHtml}
        </div>
      </div>
    `;
  }).join('');

  // コピー用データを保存
  window._lastResult = { score, allResults };

  // スクロール
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function animateScore(el, target) {
  let current = 0;
  const step = Math.max(1, Math.floor(target / 30));
  const interval = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(interval);
    }
    el.textContent = current;
  }, 20);
}

function toggleGroup(header) {
  const group = header.parentElement;
  group.classList.toggle('open');
}

function copyResult() {
  if (!window._lastResult) return;
  const { score, allResults } = window._lastResult;

  const catLabels = [
    { key: 'assertive', label: '断定型' },
    { key: 'structure', label: '三段構成' },
    { key: 'connectors', label: '接続詞' },
    { key: 'fakeEmotion', label: '感情表現' },
  ];

  const summary = catLabels.map(c => {
    const count = allResults[c.key].length;
    if (count === 0) return `${c.label}：-`;
    return `${c.label}：${count}件`;
  }).join(' / ');

  const comment = getScoreComment(score);

  const text = [
    `\u{1F9D0} それ、AIっぽくない？ 診断結果`,
    ``,
    `AIっぽさ：${score}%`,
    `${comment}`,
    ``,
    summary,
  ].join('\n');

  copyToClipboard(text).then(() => {
    const btn = document.getElementById('copy-btn');
    btn.innerHTML = '<span class="copy-icon">\u2705</span> コピーしました！';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = '<span class="copy-icon">\u{1F4CB}</span> 結果をコピー';
      btn.classList.remove('copied');
    }, 2000);
  });
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  return fallbackCopy(text);
}

function fallbackCopy(text) {
  return new Promise((resolve, reject) => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      resolve();
    } catch (e) {
      reject(e);
    } finally {
      document.body.removeChild(ta);
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
