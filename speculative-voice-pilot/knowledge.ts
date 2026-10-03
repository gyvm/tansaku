/**
 * 札幌市役所 窓口手続き・案内ナレッジベース
 * 市民からの問い合わせ上位（住民票、転入届、マイナンバーカード、ゴミ収集など）を
 * 構造化し、低遅延な意図判定と応答文の生成を行います。
 */

export interface DialogBranch {
  id: string;
  triggerKeywords: string[];
  responseSpeech: string;
  nextPrompt?: string;
  followUpBranches?: DialogBranch[];
}

export interface Scenario {
  category: string;
  title: string;
  rootBranches: DialogBranch[];
}

export const MUNICIPAL_SCENARIOS: Scenario[] = [
  {
    category: "住民票・転入届",
    title: "住民票の取得・転入に伴う手続き",
    rootBranches: [
      {
        id: "resident_record_general",
        triggerKeywords: ["住民票", "じゅうみんひょう", "証明書", "取得"],
        responseSpeech: "お電話ありがとうございます。札幌市役所コールセンターです。住民票のご案内ですね。マイナンバーカードはお持ちでしょうか？",
        nextPrompt: "マイナンバーカードはお持ちですか？",
        followUpBranches: [
          {
            id: "has_myna_card",
            triggerKeywords: ["持っている", "持ってます", "あります", "ある", "はい", "うん"],
            responseSpeech: "マイナンバーカードをお持ちでしたら、区役所に行かなくてもコンビニエンスストアのマルチコピー機ですぐに取得いただけます。手数料も窓口より50円お安く200円となります。お近くのコンビニをご利用いただけますでしょうか？"
          },
          {
            id: "no_myna_card",
            triggerKeywords: ["持っていない", "持ってない", "ないです", "ない", "いいえ", "ありません"],
            responseSpeech: "承知いたしました。それでしたら各区役所の戸籍住民課窓口か、大通証明サービスコーナーでお手続きいただけます。ご本人確認書類をお持ちの上、平日午後8時までの大通サービスコーナーも便利です。"
          }
        ]
      },
      {
        id: "moving_in",
        triggerKeywords: ["引っ越し", "引越し", "転入", "他の区", "市外", "越してきた"],
        responseSpeech: "お引越しに伴うお手続きですね。他の区や市外からの転入の場合、前住所地の転出証明書またはマイナンバーカードをご持参の上、区役所窓口でお手続きいただけます。マイナンバーカードはお持ちですか？",
        nextPrompt: "マイナンバーカードはお持ちですか？",
        followUpBranches: [
          {
            id: "moving_has_myna",
            triggerKeywords: ["持っている", "持ってます", "あります", "ある", "はい"],
            responseSpeech: "マイナンバーカードをお持ちでしたら、転出証明書がなくても特例転入が可能です。暗証番号が必要となりますのでご確認ください。",
            followUpBranches: [
              {
                id: "pin_forgotten",
                triggerKeywords: ["暗証番号", "パスワード", "覚えてない", "忘れた", "わからない", "ロック", "知らない"],
                responseSpeech: "暗証番号をお忘れの場合ですね。区役所の窓口で転入手続きをする際に、窓口で併せて暗証番号の初期化・再設定が可能ですのでご安心ください。ご本人確認書類をお持ちの上窓口でお申し出ください。"
              }
            ]
          },
          {
            id: "moving_no_myna",
            triggerKeywords: ["持っていない", "持ってない", "ないです", "ない", "いいえ"],
            responseSpeech: "承知いたしました。前住所地で発行された紙の転出証明書と、運転免許証などのご本人確認書類を必ずお持ちください。"
          },
          {
            id: "pin_forgotten_general",
            triggerKeywords: ["暗証番号", "パスワード", "覚えてない", "忘れた", "わからない", "ロック", "知らない"],
            responseSpeech: "暗証番号をお忘れの場合ですね。区役所の戸籍住民課窓口で転入届と同時に暗証番号の再設定が可能ですので、そのまま区役所窓口へお越しください。"
          }
        ]
      },
      {
        id: "pin_reset",
        triggerKeywords: ["暗証番号", "パスワード", "再設定", "初期化", "ロック解除"],
        responseSpeech: "マイナンバーカードの暗証番号再設定ですね。各区役所の戸籍住民課窓口、または大通証明サービスコーナーで即日再設定いただけます。マイナンバーカードと運転免許証などの本人確認書類をお持ちください。"
      }
    ]
  },
  {
    category: "ゴミ収集・分別",
    title: "大型ごみ・収集日",
    rootBranches: [
      {
        id: "large_garbage",
        triggerKeywords: ["大型ごみ", "粗大ごみ", "家具", "布団", "ベッド", "家電"],
        responseSpeech: "大型ごみのお申し込みですね。大型ごみ収集等受付センターでの事前予約制となっております。電話または札幌市公式ホームページからインターネットでお申し込みいただけます。ご希望の収集品目は何でしょうか？"
      },
      {
        id: "garbage_schedule",
        triggerKeywords: ["ごみ収集", "燃えるごみ", "曜日", "いつ", "カレンダー"],
        responseSpeech: "ごみ収集日のお問い合わせですね。お住まいの区と町名によって収集曜日が異なります。お住まいの地域を教えていただけますでしょうか？"
      }
    ]
  }
];

function findBranchById(branches: DialogBranch[], targetId: string): DialogBranch | null {
  for (const b of branches) {
    if (b.id === targetId) return b;
    if (b.followUpBranches) {
      const found = findBranchById(b.followUpBranches, targetId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 途中テキストから最適な応答文を推測するマッチャー
 */
export function predictResponse(input: string, currentContext?: string): { speech: string; branchId: string; confidence: number } {
  const normalized = input.trim();
  if (!normalized) {
    return {
      speech: "はい、札幌市役所コールセンターです。ご用件をお伺いいたします。",
      branchId: "default_greeting",
      confidence: 0.5
    };
  }

  // 1. 文脈にフォローアップ分岐があるかチェック（何階層でも検索）
  if (currentContext) {
    for (const scenario of MUNICIPAL_SCENARIOS) {
      const currentBranch = findBranchById(scenario.rootBranches, currentContext);
      if (currentBranch && currentBranch.followUpBranches) {
        for (const sub of currentBranch.followUpBranches) {
          for (const kw of sub.triggerKeywords) {
            if (normalized.includes(kw)) {
              return { speech: sub.responseSpeech, branchId: sub.id, confidence: 0.95 };
            }
          }
        }
      }
    }
  }

  // 2. 全ブランチ（ルートおよびサブ）からのキーワードマッチング
  // 2. 全ブランチ（ルートおよびサブ）からのキーワードマッチング
  const matches: { speech: string; branchId: string; score: number }[] = [];
  function evaluateBranches(branches: DialogBranch[]) {
    for (const branch of branches) {
      let score = 0;
      for (const kw of branch.triggerKeywords) {
        if (normalized.includes(kw)) {
          score += 1;
        }
      }
      if (score > 0) {
        matches.push({ speech: branch.responseSpeech, branchId: branch.id, score });
      }
      if (branch.followUpBranches) {
        evaluateBranches(branch.followUpBranches);
      }
    }
  }

  for (const scenario of MUNICIPAL_SCENARIOS) {
    evaluateBranches(scenario.rootBranches);
  }

  if (matches.length > 0) {
    matches.sort((a, b) => b.score - a.score);
    return { speech: matches[0].speech, branchId: matches[0].branchId, confidence: 0.85 };
  }

  // 3. 一般的な相槌・聞き返し
  return {
    speech: "お伺いいたしました。内容を確認いたしますので、具体的なお手続きやご質問内容を詳しく教えていただけますでしょうか？",
    branchId: "fallback_clarify",
    confidence: 0.4
  };
}
