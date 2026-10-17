import type { AacBoardDict, AacItem, AacKind, Lang } from "../types";

/* ==========================================================================
   MAREA VOICE — one board, one fixed order.

   Design rules (from hospital/SLT aphasia boards and AAC practice):
   - Most urgent first: yes/no, help, pain, feeling unwell, toilet, drink,
     food, rest ... then conversation repair, comfort, feelings, closeness.
   - Positions never change (motor planning): a card keeps its place forever.
   - Concrete, literal, short. No metaphors ("underwater", "trapped").
   - "My brain works, speech is hard" stays near the top: the person is
     competent and says so (Supported Conversation for Adults with Aphasia).
   - Wording is gender-neutral wherever the language allows it, because the
     phrase is spoken aloud in the user's own voice.
   Each entry: [text shown on the card, phrase spoken aloud].
   ========================================================================== */

type Pair = [string, string];
type Row = { id: string; icon: string; kind: AacKind; t: Record<Lang, Pair> };

const ROWS: Row[] = [
    { id: "yes", icon: "yes", kind: "yes", t: {
        es: ["Sí", "Sí"], en: ["Yes", "Yes"], it: ["Sì", "Sì"], fr: ["Oui", "Oui"],
        de: ["Ja", "Ja"], zh: ["是", "是"], pt: ["Sim", "Sim"], ja: ["はい", "はい"] } },
    { id: "no", icon: "no", kind: "no", t: {
        es: ["No", "No"], en: ["No", "No"], it: ["No", "No"], fr: ["Non", "Non"],
        de: ["Nein", "Nein"], zh: ["不是", "不是"], pt: ["Não", "Não"], ja: ["いいえ", "いいえ"] } },
    { id: "help", icon: "help", kind: "urgent", t: {
        es: ["Necesito ayuda", "Necesito ayuda ahora, por favor"],
        en: ["I need help", "I need help now, please"],
        it: ["Ho bisogno di aiuto", "Ho bisogno di aiuto subito, per favore"],
        fr: ["J'ai besoin d'aide", "J'ai besoin d'aide tout de suite, s'il vous plaît"],
        de: ["Ich brauche Hilfe", "Ich brauche sofort Hilfe, bitte"],
        zh: ["我需要帮助", "我现在需要帮助，请快一点"],
        pt: ["Preciso de ajuda", "Preciso de ajuda agora, por favor"],
        ja: ["助けてください", "今すぐ助けてください、お願いします"] } },
    { id: "pain", icon: "pain", kind: "urgent", t: {
        es: ["Me duele", "Me duele. Necesito ayuda"],
        en: ["I am in pain", "I am in pain. I need help"],
        it: ["Ho dolore", "Ho dolore. Ho bisogno di aiuto"],
        fr: ["J'ai mal", "J'ai mal. J'ai besoin d'aide"],
        de: ["Ich habe Schmerzen", "Ich habe Schmerzen. Ich brauche Hilfe"],
        zh: ["我疼", "我很疼，需要帮助"],
        pt: ["Tenho dor", "Tenho dor. Preciso de ajuda"],
        ja: ["痛いです", "痛いです。助けてください"] } },
    { id: "sick", icon: "sick", kind: "urgent", t: {
        es: ["Me siento mal", "Me siento mal. Tengo mareo o náuseas"],
        en: ["I feel unwell", "I feel unwell. I am dizzy or nauseous"],
        it: ["Mi sento male", "Mi sento male. Ho vertigini o nausea"],
        fr: ["Je me sens mal", "Je me sens mal. J'ai des vertiges ou la nausée"],
        de: ["Mir ist schlecht", "Mir ist schlecht oder schwindelig"],
        zh: ["我不舒服", "我不舒服，头晕或想吐"],
        pt: ["Sinto-me mal", "Sinto-me mal. Tenho tonturas ou náuseas"],
        ja: ["気分が悪いです", "気分が悪いです。めまいか吐き気があります"] } },
    { id: "bathroom", icon: "bathroom", kind: "need", t: {
        es: ["Necesito el baño", "Necesito ir al baño"],
        en: ["I need the bathroom", "I need to use the bathroom"],
        it: ["Ho bisogno del bagno", "Ho bisogno di andare in bagno"],
        fr: ["J'ai besoin des toilettes", "J'ai besoin d'aller aux toilettes"],
        de: ["Ich muss zur Toilette", "Ich muss zur Toilette"],
        zh: ["我要上厕所", "我需要去上厕所"],
        pt: ["Preciso da casa de banho", "Preciso de ir à casa de banho"],
        ja: ["トイレに行きたいです", "トイレに行きたいです"] } },
    { id: "water", icon: "water", kind: "need", t: {
        es: ["Quiero agua", "Quiero agua, por favor"],
        en: ["I want water", "I would like some water, please"],
        it: ["Voglio acqua", "Vorrei dell'acqua, per favore"],
        fr: ["Je veux de l'eau", "Je voudrais de l'eau, s'il vous plaît"],
        de: ["Ich möchte Wasser", "Ich möchte bitte Wasser"],
        zh: ["我想喝水", "请给我一点水"],
        pt: ["Quero água", "Quero água, por favor"],
        ja: ["水が飲みたいです", "お水をください"] } },
    { id: "food", icon: "food", kind: "need", t: {
        es: ["Tengo hambre", "Tengo hambre. Quiero comer"],
        en: ["I am hungry", "I am hungry. I want to eat"],
        it: ["Ho fame", "Ho fame. Voglio mangiare"],
        fr: ["J'ai faim", "J'ai faim. Je veux manger"],
        de: ["Ich habe Hunger", "Ich habe Hunger. Ich möchte essen"],
        zh: ["我饿了", "我饿了，想吃东西"],
        pt: ["Tenho fome", "Tenho fome. Quero comer"],
        ja: ["お腹が空きました", "お腹が空きました。食べたいです"] } },
    { id: "rest", icon: "rest", kind: "need", t: {
        es: ["Quiero descansar", "Quiero descansar. Tengo mucho cansancio"],
        en: ["I want to rest", "I want to rest. I am very tired"],
        it: ["Voglio riposare", "Voglio riposare. Sento molta stanchezza"],
        fr: ["Je veux me reposer", "Je veux me reposer. J'ai besoin de repos"],
        de: ["Ich möchte ausruhen", "Ich möchte mich ausruhen. Ich bin sehr müde"],
        zh: ["我想休息", "我很累，想休息一下"],
        pt: ["Quero descansar", "Quero descansar. Estou com muito cansaço"],
        ja: ["休みたいです", "とても疲れているので休みたいです"] } },
    { id: "brain", icon: "brain", kind: "talk", t: {
        es: ["Mi cerebro funciona, me cuesta hablar", "Mi cerebro funciona perfectamente, pero me cuesta hablar en este momento. Por favor, ten paciencia conmigo."],
        en: ["My brain works, speech is hard", "My brain works perfectly fine, but I struggle to speak right now. Please have patience with me."],
        it: ["Il mio cervello funziona, parlare è difficile", "Il mio cervello funziona benissimo, ma ho difficoltà a parlare in questo momento. Per favore, abbi pazienza con me."],
        fr: ["Mon cerveau fonctionne, parler est difficile", "Mon cerveau fonctionne très bien, mais j'ai du mal à parler en ce moment. S'il vous plaît, soyez patient avec moi."],
        de: ["Mein Gehirn arbeitet, Sprechen ist schwer", "Mein Gehirn funktioniert völlig normal, aber das Sprechen fällt mir gerade schwer. Bitte hab Geduld mit mir."],
        zh: ["我脑子清醒，说话困难", "我的大脑运转正常，但此刻说话有些困难。请对我多一些耐心。"],
        pt: ["O meu cérebro funciona, falar é difícil", "O meu cérebro funciona perfeitamente, mas custa-me falar neste momento. Por favor, tem paciência comigo."],
        ja: ["頭はしっかりしていますが、話すのが難しいです", "頭ははっきりしていますが、今は話すことが難しいです。少し待っていただけると助かります。"] } },
    { id: "wait", icon: "wait", kind: "talk", t: {
        es: ["Espera, por favor", "Espera, por favor. Necesito un momento para expresarme"],
        en: ["Wait, please", "Please wait. I need a moment to express myself"],
        it: ["Aspetta, per favore", "Aspetta, per favore. Ho bisogno di un momento per esprimermi"],
        fr: ["Attends, s'il te plaît", "Attends, s'il te plaît. J'ai besoin d'un moment pour m'exprimer"],
        de: ["Warte bitte", "Bitte warte. Ich brauche einen Moment, um mich auszudrücken"],
        zh: ["请等一下", "请等一下，我需要一点时间来表达"],
        pt: ["Espera, por favor", "Espera, por favor. Preciso de um momento para me expressar"],
        ja: ["少し待ってください", "少し待ってください。伝えるのに時間が必要です"] } },
    { id: "slow", icon: "repeat", kind: "talk", t: {
        es: ["Más despacio", "Por favor, habla más despacio y repítelo"],
        en: ["Slower, please", "Please speak more slowly and say it again"],
        it: ["Più piano", "Per favore, parla più piano e ripeti"],
        fr: ["Plus lentement", "Plus lentement, s'il te plaît, et répète"],
        de: ["Langsamer bitte", "Bitte sprich langsamer und wiederhole es"],
        zh: ["请慢一点", "请说慢一点，再说一遍"],
        pt: ["Mais devagar", "Por favor, fala mais devagar e repete"],
        ja: ["ゆっくりお願いします", "ゆっくり、もう一度言ってください"] } },
    { id: "confused", icon: "confused", kind: "talk", t: {
        es: ["No entiendo", "No entiendo. ¿Puedes decirlo de otra forma?"],
        en: ["I don't understand", "I don't understand. Can you say it another way?"],
        it: ["Non capisco", "Non capisco. Puoi dirlo in un altro modo?"],
        fr: ["Je ne comprends pas", "Je ne comprends pas. Peux-tu le dire autrement ?"],
        de: ["Ich verstehe nicht", "Ich verstehe nicht. Kannst du es anders sagen?"],
        zh: ["我不明白", "我不明白，能换种说法吗？"],
        pt: ["Não entendo", "Não entendo. Podes dizer de outra forma?"],
        ja: ["わかりません", "わかりません。別の言い方で言ってもらえますか？"] } },
    { id: "cold", icon: "cold", kind: "need", t: {
        es: ["Tengo frío", "Tengo frío"], en: ["I am cold", "I am cold"], it: ["Ho freddo", "Ho freddo"],
        fr: ["J'ai froid", "J'ai froid"], de: ["Mir ist kalt", "Mir ist kalt"], zh: ["我冷", "我觉得冷"],
        pt: ["Tenho frio", "Tenho frio"], ja: ["寒いです", "寒いです"] } },
    { id: "hot", icon: "hot", kind: "need", t: {
        es: ["Tengo calor", "Tengo calor"], en: ["I am hot", "I am hot"], it: ["Ho caldo", "Ho caldo"],
        fr: ["J'ai chaud", "J'ai chaud"], de: ["Mir ist heiß", "Mir ist heiß"], zh: ["我热", "我觉得热"],
        pt: ["Tenho calor", "Tenho calor"], ja: ["暑いです", "暑いです"] } },
    { id: "move", icon: "move", kind: "need", t: {
        es: ["Cambiarme de postura", "Quiero cambiar de postura o de sitio, por favor"],
        en: ["Change my position", "I want to change position or move, please"],
        it: ["Cambiare posizione", "Voglio cambiare posizione o spostarmi, per favore"],
        fr: ["Changer de position", "Je voudrais changer de position ou de place, s'il vous plaît"],
        de: ["Andere Position", "Ich möchte meine Position ändern, bitte"],
        zh: ["换个姿势", "请帮我换个姿势或换个地方"],
        pt: ["Mudar de posição", "Quero mudar de posição ou de lugar, por favor"],
        ja: ["体勢を変えたい", "体勢か場所を変えたいです、お願いします"] } },
    { id: "noise", icon: "overload", kind: "feel", t: {
        es: ["Hay demasiado ruido", "Hay demasiado ruido o movimiento. Necesito calma"],
        en: ["Too much noise", "There is too much noise or activity. I need calm"],
        it: ["Troppo rumore", "C'è troppo rumore o movimento. Ho bisogno di calma"],
        fr: ["Trop de bruit", "Il y a trop de bruit ou d'agitation. J'ai besoin de calme"],
        de: ["Zu laut", "Es ist zu laut oder zu unruhig. Ich brauche Ruhe"],
        zh: ["太吵了", "太吵或太乱了，我需要安静"],
        pt: ["Demasiado ruído", "Há demasiado ruído ou agitação. Preciso de calma"],
        ja: ["うるさすぎる", "うるさい、または落ち着かないです。静かにしたいです"] } },
    { id: "frustrated", icon: "frustrated", kind: "feel", t: {
        es: ["Frustración", "Siento mucha frustración por no poder comunicarme bien"],
        en: ["Frustration", "I feel very frustrated because I cannot communicate well"],
        it: ["Frustrazione", "Provo molta frustrazione perché non riesco a comunicare bene"],
        fr: ["Frustration", "Je ressens beaucoup de frustration car je n'arrive pas à bien communiquer"],
        de: ["Frustration", "Ich bin sehr frustriert, weil ich mich nicht gut mitteilen kann"],
        zh: ["挫败感", "因为无法顺利沟通，我感到非常挫败"],
        pt: ["Frustração", "Sinto muita frustração por não me conseguir comunicar bem"],
        ja: ["もどかしいです", "うまくコミュニケーションが取れなくて、とてももどかしいです"] } },
    { id: "sad", icon: "sad", kind: "feel", t: {
        es: ["Estoy triste", "Me siento triste"],
        en: ["I am sad", "I feel sad and low"],
        it: ["Sono triste", "Mi sento triste e giù di morale"],
        fr: ["Je suis triste", "Je me sens triste"],
        de: ["Ich bin traurig", "Ich fühle mich traurig und niedergeschlagen"],
        zh: ["我很伤心", "我感到很伤心和低落"],
        pt: ["Estou triste", "Sinto-me triste"],
        ja: ["悲しいです", "悲しくて気分が落ち込んでいます"] } },
    { id: "hug", icon: "hug", kind: "feel", t: {
        es: ["Necesito un abrazo", "Necesito contacto físico o un abrazo de apoyo"],
        en: ["I need a hug", "I need physical contact or a supportive hug"],
        it: ["Ho bisogno di un abbraccio", "Ho bisogno di contatto fisico o di un abbraccio di supporto"],
        fr: ["Besoin d'un câlin", "J'ai besoin d'un contact physique ou d'un câlin de soutien"],
        de: ["Brauche eine Umarmung", "Ich brauche Körperkontakt oder eine unterstützende Umarmung"],
        zh: ["需要拥抱", "我需要一些肢体接触或一个支持性的拥抱"],
        pt: ["Preciso de um abraço", "Preciso de contacto físico ou de um abraço de apoio"],
        ja: ["抱きしめてほしいです", "体に触れてもらうか、ハグをして支えてほしいです"] } },
    { id: "alone", icon: "alone", kind: "feel", t: {
        es: ["Quiero estar a solas", "Quiero estar a solas un rato, en silencio"],
        en: ["I want to be alone", "I want to be alone in silence for a while"],
        it: ["Voglio stare da solo", "Voglio stare un po' in silenzio, per conto mio"],
        fr: ["Je veux être seul(e)", "Je voudrais un moment de calme, à l'écart"],
        de: ["Ich will allein sein", "Ich möchte eine Weile allein und in Ruhe sein"],
        zh: ["想单独静静", "我想一个人安静地待一会儿"],
        pt: ["Quero estar sozinho(a)", "Quero um momento de silêncio, a sós"],
        ja: ["一人になりたいです", "しばらく静かに一人で過ごしたいです"] } },
    { id: "thanks", icon: "thanks", kind: "talk", t: {
        es: ["Gracias", "Muchas gracias"], en: ["Thank you", "Thank you very much"], it: ["Grazie", "Grazie mille"],
        fr: ["Merci", "Merci beaucoup"], de: ["Danke", "Vielen Dank"], zh: ["谢谢", "非常感谢你"],
        pt: ["Obrigado/a", "Muito obrigado"], ja: ["ありがとう", "ありがとうございます"] } },
    { id: "love", icon: "love", kind: "feel", t: {
        es: ["Te quiero", "Te quiero"], en: ["I love you", "I love you"], it: ["Ti voglio bene", "Ti voglio bene"],
        fr: ["Je t'aime", "Je t'aime"], de: ["Hab dich lieb", "Ich habe dich lieb"], zh: ["我爱你", "我爱你"],
        pt: ["Amo-te", "Amo-te"], ja: ["大好きです", "大好きです"] } },
    { id: "home", icon: "home", kind: "feel", t: {
        es: ["Quiero ir a casa", "Quiero volver a mi casa, por favor."],
        en: ["I want to go home", "I want to go back home, please."],
        it: ["Voglio andare a casa", "Voglio tornare a casa, per favore."],
        fr: ["Je veux rentrer", "Je veux rentrer chez moi, s'il vous plaît."],
        de: ["Ich möchte nach Hause", "Ich möchte bitte nach Hause gehen."],
        zh: ["我想回家", "我想回家，谢谢。"],
        pt: ["Quero ir para casa", "Quero voltar para casa, por favor."],
        ja: ["家に帰りたいです", "家に帰りたいです、お願いします。"] } },
];

const LANGS: Lang[] = ["es", "en", "it", "fr", "de", "zh", "pt", "ja"];

const aacBoardData = Object.fromEntries(
    LANGS.map((lang) => [
        lang,
        ROWS.map((r): AacItem => ({ id: r.id, icon: r.icon, kind: r.kind, text: r.t[lang][0], spoken: r.t[lang][1] })),
    ]),
) as AacBoardDict;

export { aacBoardData };
