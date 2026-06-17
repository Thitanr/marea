import type { AacBoardDict } from "../types";

const aacBoardData: AacBoardDict = {
    es: {
        needs: [
            { icon: "help", text: "Necesito ayuda urgente", spoken: "Necesito ayuda urgente" },
            { icon: "water", text: "Quiero agua", spoken: "Quiero beber agua, por favor" },
            { icon: "food", text: "Tengo hambre", spoken: "Tengo hambre, quiero comer algo" },
            { icon: "pain", text: "Tengo dolor", spoken: "Tengo dolor físico, necesito ayuda" },
            { icon: "rest", text: "Quiero descansar", spoken: "Estoy muy cansado y necesito descansar" },
            { icon: "move", text: "Quiero cambiar de lugar", spoken: "Quiero moverme o cambiar de sitio, por favor" },
            { icon: "bathroom", text: "Necesito el baño", spoken: "Necesito ir al baño" },
            { icon: "temp", text: "Tengo frío/calor", spoken: "Tengo frío o calor, necesito regular la temperatura" }
        ],
        social: [
            { icon: "brain", text: "Mi cerebro funciona bien, me cuesta hablar", spoken: "Mi cerebro funciona perfectamente, pero me cuesta hablar en este momento. Por favor, ten paciencia conmigo." },
            { icon: "yes", text: "Sí", spoken: "Sí" },
            { icon: "no", text: "No", spoken: "No" },
            { icon: "thanks", text: "Gracias", spoken: "Muchas gracias" },
            { icon: "wait", text: "Espérame, por favor", spoken: "Por favor, dame un momento para expresarme." },
            { icon: "confused", text: "No entiendo", spoken: "No entiendo lo que quieres decir, ¿puedes explicarlo de otra forma?" },
            { icon: "mute", text: "No puedo hablar ahora", spoken: "No puedo hablar en este momento." },
            { icon: "home", text: "Quiero ir a casa", spoken: "Quiero volver a mi casa, por favor." }
        ],
        emotions: [
            { icon: "underwater", text: "Me siento bajo el agua", spoken: "Me siento abrumado y bajo el agua en este momento" },
            { icon: "overload", text: "Mucha sobrecarga", spoken: "Tengo una gran sobrecarga sensorial y mental, hay demasiado ruido o estímulo" },
            { icon: "sad", text: "Estoy triste", spoken: "Me siento triste y decaído" },
            { icon: "frustrated", text: "Frustración", spoken: "Siento mucha frustración por no poderme comunicar bien" },
            { icon: "trapped", text: "Atrapado/a en mi mente", spoken: "Me siento atrapado dentro de mi propia mente" },
            { icon: "hug", text: "Necesito un abrazo", spoken: "Necesito contacto físico o un abrazo de apoyo" },
            { icon: "love", text: "Te quiero", spoken: "Te quiero" },
            { icon: "alone", text: "Necesito estar solo/a", spoken: "Necesito estar solo en silencio un rato" }
        ]
    },
    en: {
        needs: [
            { icon: "help", text: "I need urgent help", spoken: "I need urgent help" },
            { icon: "water", text: "I want water", spoken: "I would like some water, please" },
            { icon: "food", text: "I am hungry", spoken: "I am hungry, I want to eat something" },
            { icon: "pain", text: "I am in pain", spoken: "I am in physical pain, I need assistance" },
            { icon: "rest", text: "I want to rest", spoken: "I am very tired and I need to rest" },
            { icon: "move", text: "I want to move", spoken: "I want to move or change location, please" },
            { icon: "bathroom", text: "Need bathroom", spoken: "I need to use the bathroom" },
            { icon: "temp", text: "Cold/Hot", spoken: "I feel too cold or too hot, I need to adjust the temperature" }
        ],
        social: [
            { icon: "brain", text: "My brain works, speech is hard", spoken: "My brain works perfectly fine, but I struggle to speak right now. Please have patience with me." },
            { icon: "yes", text: "Yes", spoken: "Yes" },
            { icon: "no", text: "No", spoken: "No" },
            { icon: "thanks", text: "Thank you", spoken: "Thank you very much" },
            { icon: "wait", text: "Wait, please", spoken: "Please give me a moment to express myself." },
            { icon: "confused", text: "I don't understand", spoken: "I don't understand what you mean, can you explain it differently?" },
            { icon: "mute", text: "Can't speak now", spoken: "I cannot speak right now." },
            { icon: "home", text: "Want to go home", spoken: "I want to go back home, please." }
        ],
        emotions: [
            { icon: "underwater", text: "I feel underwater", spoken: "I feel overwhelmed and underwater right now" },
            { icon: "overload", text: "Sensory overload", spoken: "I am experiencing heavy sensory and mental overload, there is too much noise or input" },
            { icon: "sad", text: "I am sad", spoken: "I feel sad and low" },
            { icon: "frustrated", text: "Frustration", spoken: "I feel very frustrated because I cannot communicate well" },
            { icon: "trapped", text: "Trapped in my mind", spoken: "I feel trapped inside my own mind" },
            { icon: "hug", text: "I need a hug", spoken: "I need physical contact or a supportive hug" },
            { icon: "love", text: "I love you", spoken: "I love you" },
            { icon: "alone", text: "Need to be alone", spoken: "I need to be alone in silence for a while" }
        ]
    },
    it: {
        needs: [
            { icon: "help", text: "Ho bisogno di aiuto urgente", spoken: "Ho bisogno di aiuto urgente" },
            { icon: "water", text: "Voglio acqua", spoken: "Voglio bere acqua, per favore" },
            { icon: "food", text: "Ho fame", spoken: "Ho fame, voglio mangiare qualcosa" },
            { icon: "pain", text: "Ho dolore", spoken: "Ho dolore fisico, ho bisogno di aiuto" },
            { icon: "rest", text: "Voglio riposare", spoken: "Sono molto stanco e ho bisogno di riposare" },
            { icon: "move", text: "Voglio spostarmi", spoken: "Voglio muovermi o cambiare posto, per favore" },
            { icon: "bathroom", text: "Ho bisogno del bagno", spoken: "Ho bisogno di andare in bagno" },
            { icon: "temp", text: "Ho freddo/caldo", spoken: "Ho freddo o caldo, ho bisogno di regolare la temperatura" }
        ],
        social: [
            { icon: "brain", text: "Il mio cervello funziona, parlare è difficile", spoken: "Il mio cervello funziona benissimo, ma ho difficoltà a parlare in questo momento. Per favore, abbi pazienza con me." },
            { icon: "yes", text: "Sì", spoken: "Sì" },
            { icon: "no", text: "No", spoken: "No" },
            { icon: "thanks", text: "Grazie", spoken: "Grazie mille" },
            { icon: "wait", text: "Aspetta, per favore", spoken: "Per favore, dammi un momento per esprimermi." },
            { icon: "confused", text: "Non capisco", spoken: "Non capisco cosa intendi, puoi spiegarmelo diversamente?" },
            { icon: "mute", text: "Non posso parlare ora", spoken: "Non posso parlare in questo momento." },
            { icon: "home", text: "Voglio andare a casa", spoken: "Voglio tornare a casa, per favore." }
        ],
        emotions: [
            { icon: "underwater", text: "Mi sento sott'acqua", spoken: "Mi sento sopraffatto e sott'acqua in questo momento" },
            { icon: "overload", text: "Sovraccarico sensoriale", spoken: "Sto vivendo un forte sovraccarico sensoriale e mentale, c'è troppa stimolazione o rumore" },
            { icon: "sad", text: "Sono triste", spoken: "Mi sento triste e giù di morale" },
            { icon: "frustrated", text: "Frustrazione", spoken: "Mi sento molto frustrato perché non riesco a comunicarmi bene" },
            { icon: "trapped", text: "Intrappolato/a nella mia mente", spoken: "Mi sento intrappolato dentro la mia stessa mente" },
            { icon: "hug", text: "Ho bisogno di un abbraccio", spoken: "Ho bisogno di contatto fisico o di un abbraccio di supporto" },
            { icon: "love", text: "Ti voglio bene", spoken: "Ti voglio bene" },
            { icon: "alone", text: "Ho bisogno di stare da solo/a", spoken: "Ho bisogno di stare da solo in silenzio per un po'" }
        ]
    },
    fr: {
        needs: [
            { icon: "help", text: "Besoin d'aide urgente", spoken: "J'ai besoin d'aide urgente" },
            { icon: "water", text: "Je veux de l'eau", spoken: "Je voudrais de l'eau, s'il vous plaît" },
            { icon: "food", text: "J'ai faim", spoken: "J'ai faim, je veux manger quelque chose" },
            { icon: "pain", text: "J'ai mal", spoken: "J'ai une douleur physique, j'ai besoin d'aide" },
            { icon: "rest", text: "Je veux me reposer", spoken: "Je suis très fatigué et j'ai besoin de me reposer" },
            { icon: "move", text: "Je veux bouger", spoken: "Je veux me déplacer ou changer de place, s'il vous plaît" },
            { icon: "bathroom", text: "Besoin des toilettes", spoken: "J'ai besoin d'aller aux toilettes" },
            { icon: "temp", text: "J'ai froid/chaud", spoken: "J'ai froid ou chaud, j'ai besoin de réguler la température" }
        ],
        social: [
            { icon: "brain", text: "Mon cerveau fonctionne, parler est difficile", spoken: "Mon cerveau fonctionne très bien, mais j'ai du mal à parler en ce moment. S'il vous plaît, soyez patient avec moi." },
            { icon: "yes", text: "Oui", spoken: "Oui" },
            { icon: "no", text: "Non", spoken: "Non" },
            { icon: "thanks", text: "Merci", spoken: "Merci beaucoup" },
            { icon: "wait", text: "Attends, s'il te plaît", spoken: "S'il vous plaît, donne-moi un moment pour m'exprimer." },
            { icon: "confused", text: "Je ne comprends pas", spoken: "Je ne comprends pas ce que tu veux dire, peux-tu expliquer différemment ?" },
            { icon: "mute", text: "Je ne peux pas parler maintenant", spoken: "Je ne peux pas parler en ce moment." },
            { icon: "home", text: "Je veux rentrer", spoken: "Je veux rentrer chez moi, s'il vous plaît." }
        ],
        emotions: [
            { icon: "underwater", text: "Je me sens sous l'eau", spoken: "Je me sens submergé et sous l'eau en ce moment" },
            { icon: "overload", text: "Surcharge sensorielle", spoken: "Je vis une forte surcharge sensorielle et mentale, il y a trop de bruit ou de stimulation" },
            { icon: "sad", text: "Je suis triste", spoken: "Je me sens triste et abattu" },
            { icon: "frustrated", text: "Frustration", spoken: "Je ressens beaucoup de frustration car je n'arrive pas à bien communiquer" },
            { icon: "trapped", text: "Coincé(e) dans ma tête", spoken: "Je me sens piégé dans mon propre esprit" },
            { icon: "hug", text: "Besoin d'un câlin", spoken: "J'ai besoin d'un contact physique ou d'un câlin de soutien" },
            { icon: "love", text: "Je t'aime", spoken: "Je t'aime" },
            { icon: "alone", text: "Besoin d'être seul(e)", spoken: "J'ai besoin d'être seul en silence un moment" }
        ]
    },
    de: {
        needs: [
            { icon: "help", text: "Brauche dringend Hilfe", spoken: "Ich brauche dringend Hilfe" },
            { icon: "water", text: "Ich möchte Wasser", spoken: "Ich hätte gerne etwas Wasser, bitte" },
            { icon: "food", text: "Ich habe Hunger", spoken: "Ich habe Hunger, ich möchte etwas essen" },
            { icon: "pain", text: "Ich habe Schmerzen", spoken: "Ich habe körperliche Schmerzen, ich brauche Hilfe" },
            { icon: "rest", text: "Ich möchte ausruhen", spoken: "Ich bin sehr müde und muss mich ausruhen" },
            { icon: "move", text: "Ich möchte mich bewegen", spoken: "Ich möchte den Ort wechseln oder mich bewegen, bitte" },
            { icon: "bathroom", text: "Ich muss zur Toilette", spoken: "Ich muss die Toilette benutzen" },
            { icon: "temp", text: "Mir ist kalt/heiß", spoken: "Mir ist zu kalt oder zu heiß, ich muss die Temperatur regeln" }
        ],
        social: [
            { icon: "brain", text: "Mein Gehirn arbeitet, Sprechen ist schwer", spoken: "Mein Gehirn funktioniert völlig normal, aber das Sprechen fällt mir gerade schwer. Bitte hab Geduld mit mir." },
            { icon: "yes", text: "Ja", spoken: "Ja" },
            { icon: "no", text: "Nein", spoken: "Nein" },
            { icon: "thanks", text: "Danke", spoken: "Vielen Dank" },
            { icon: "wait", text: "Warte bitte", spoken: "Bitte gib mir einen Moment, um mich auszudrücken." },
            { icon: "confused", text: "Ich verstehe nicht", spoken: "Ich verstehe nicht, was du meinst. Kannst du es anders erklären?" },
            { icon: "mute", text: "Kann gerade nicht sprechen", spoken: "Ich kann im Moment nicht sprechen." },
            { icon: "home", text: "Ich möchte nach Hause", spoken: "Ich möchte bitte nach Hause gehen." }
        ],
        emotions: [
            { icon: "underwater", text: "Fühle mich wie unter Wasser", spoken: "Ich fühle mich gerade überfordert und wie unter Wasser" },
            { icon: "overload", text: "Reizüberflutung", spoken: "Ich erlebe eine starke sensorische und mentale Reizüberflutung, es ist zu laut oder zu viel" },
            { icon: "sad", text: "Ich bin traurig", spoken: "Ich fühle mich traurig und niedergeschlagen" },
            { icon: "frustrated", text: "Frustration", spoken: "Ich bin sehr frustriert, weil ich mich nicht gut mitteilen kann" },
            { icon: "trapped", text: "Gefangen im Kopf", spoken: "Ich fühle mich in meinem eigenen Kopf gefangen" },
            { icon: "hug", text: "Brauche eine Umarmung", spoken: "Ich brauche Körperkontakt oder eine unterstützende Umarmung" },
            { icon: "love", text: "Hab dich lieb", spoken: "Ich habe dich lieb" },
            { icon: "alone", text: "Möchte allein sein", spoken: "Ich muss eine Weile allein und in Ruhe sein" }
        ]
    },
    zh: {
        needs: [
            { icon: "help", text: "需要紧急帮助", spoken: "我需要紧急帮助" },
            { icon: "water", text: "我想喝水", spoken: "请给我一点水，谢谢" },
            { icon: "food", text: "我饿了", spoken: "我饿了，我想吃点东西" },
            { icon: "pain", text: "我身体痛", spoken: "我身体有些痛，需要帮助" },
            { icon: "rest", text: "我想休息", spoken: "我很累，需要休息一下" },
            { icon: "move", text: "我想移动一下", spoken: "请帮我换个地方或移动一下" },
            { icon: "bathroom", text: "需要上厕所", spoken: "我需要去上厕所" },
            { icon: "temp", text: "冷或热", spoken: "我觉得太冷或太热，需要调节温度" }
        ],
        social: [
            { icon: "brain", text: "我脑子清醒，说话困难", spoken: "我的大脑运转正常，但此刻说话有些困难。请对我多一些耐心。" },
            { icon: "yes", text: "是", spoken: "是" },
            { icon: "no", text: "否", spoken: "不是" },
            { icon: "thanks", text: "谢谢", spoken: "非常感谢你" },
            { icon: "wait", text: "请等一下", spoken: "请给我一点时间来表达自己。" },
            { icon: "confused", text: "我不明白", spoken: "我不明白你的意思，能换种方式解释吗？" },
            { icon: "mute", text: "我现在无法说话", spoken: "我现在无法开口说话。" },
            { icon: "home", text: "我想回家", spoken: "我想回家，谢谢。" }
        ],
        emotions: [
            { icon: "underwater", text: "感觉被水淹没", spoken: "我现在感觉非常压抑，就像被水淹没一样" },
            { icon: "overload", text: "感官超载", spoken: "我现在感官和精神严重超载，周围太吵或刺激太多了" },
            { icon: "sad", text: "我很伤心", spoken: "我感到很伤心和低落" },
            { icon: "frustrated", text: "挫败感", spoken: "因为无法顺利沟通，我感到非常挫败" },
            { icon: "trapped", text: "困在思绪中", spoken: "我觉得自己被困在自己的大脑和思绪里了" },
            { icon: "hug", text: "需要拥抱", spoken: "我需要一些肢体接触或一个支持性的拥抱" },
            { icon: "love", text: "我爱你", spoken: "我爱你" },
            { icon: "alone", text: "想单独静静", spoken: "我需要一个人安安静静地呆一会儿" }
        ]
    },
    pt: {
        needs: [
            { icon: "help", text: "Preciso de ajuda urgente", spoken: "Preciso de ajuda urgente" },
            { icon: "water", text: "Quero água", spoken: "Gostaria de beber água, por favor" },
            { icon: "food", text: "Tenho fome", spoken: "Tenho fome, quero comer alguma coisa" },
            { icon: "pain", text: "Tenho dor", spoken: "Tenho dores físicas, preciso de ajuda" },
            { icon: "rest", text: "Quero descansar", spoken: "Estou muito cansado e preciso de descansar" },
            { icon: "move", text: "Quero mudar de lugar", spoken: "Quero mover-me ou mudar de sítio, por favor" },
            { icon: "bathroom", text: "Preciso de ir à casa de banho", spoken: "Preciso de ir à casa de banho" },
            { icon: "temp", text: "Tenho frio/calor", spoken: "Tenho frio ou calor, preciso de regular a temperatura" }
        ],
        social: [
            { icon: "brain", text: "O meu cérebro funciona, falar é difícil", spoken: "O meu cérebro funciona perfeitamente, mas custa-me falar neste momento. Por favor, tem paciência comigo." },
            { icon: "yes", text: "Sim", spoken: "Sim" },
            { icon: "no", text: "Não", spoken: "Não" },
            { icon: "thanks", text: "Obrigado", spoken: "Muito obrigado" },
            { icon: "wait", text: "Espera, por favor", spoken: "Por favor, dá-me um momento para me expressar." },
            { icon: "confused", text: "Não entendo", spoken: "Não entendo o que queres dizer, podes explicar de outra forma?" },
            { icon: "mute", text: "Não consigo falar agora", spoken: "Não consigo falar neste momento." },
            { icon: "home", text: "Quero ir para casa", spoken: "Quero voltar para casa, por favor." }
        ],
        emotions: [
            { icon: "underwater", text: "Sinto-me debaixo de água", spoken: "Sinto-me sobrecarregado e debaixo de água neste momento" },
            { icon: "overload", text: "Sobrecarga sensorial", spoken: "Estou a sentir uma grande sobrecarga sensorial e mental, há muito ruído ou estímulo" },
            { icon: "sad", text: "Estou triste", spoken: "Sinto-me triste e desanimado" },
            { icon: "frustrated", text: "Frustração", spoken: "Sinto muita frustração por não me conseguir comunicar bem" },
            { icon: "trapped", text: "Preso na minha mente", spoken: "Sinto-me preso dentro da minha própria mente" },
            { icon: "hug", text: "Preciso de um abraço", spoken: "Preciso de contacto físico ou de um abraço de apoio" },
            { icon: "love", text: "Amo-te", spoken: "Amo-te" },
            { icon: "alone", text: "Preciso de estar sozinho(a)", spoken: "Preciso de estar sozinho em silêncio um pouco" }
        ]
    },
    ja: {
        needs: [
            { icon: "help", text: "緊急の助けが必要です", spoken: "緊急の助けが必要です" },
            { icon: "water", text: "水が欲しいです", spoken: "お水をいただけますか、お願いします" },
            { icon: "food", text: "お腹が空きました", spoken: "お腹が空きました、何か食べたいです" },
            { icon: "pain", text: "痛みがあります", spoken: "体に痛みがあります、助けてください" },
            { icon: "rest", text: "休みたいです", spoken: "とても疲れているので休みたいです" },
            { icon: "move", text: "移動したいです", spoken: "場所を移動するか、動いたいのです、お願いします" },
            { icon: "bathroom", text: "トイレに行きたいです", spoken: "トイレに行きたいです" },
            { icon: "temp", text: "寒い／暑い", spoken: "寒すぎるか暑すぎるので、温度を調整したいです" }
        ],
        social: [
            { icon: "brain", text: "頭はしっかりしていますが、話すのが難しいです", spoken: "頭ははっきりしていますが、今は話すことが難しいです。少し待っていただけると助かります。" },
            { icon: "yes", text: "はい", spoken: "はい" },
            { icon: "no", text: "いいえ", spoken: "いいえ" },
            { icon: "thanks", text: "ありがとう", spoken: "ありがとうございます" },
            { icon: "wait", text: "少し待ってください", spoken: "自分の気持ちを伝えるまで、少し時間をください。" },
            { icon: "confused", text: "わかりません", spoken: "おっしゃっている意味がわかりません、別の方法で説明していただけますか？" },
            { icon: "mute", text: "今は話せません", spoken: "今は話すことができません。" },
            { icon: "home", text: "家に帰りたいです", spoken: "家に帰りたいです、お願いします。" }
        ],
        emotions: [
            { icon: "underwater", text: "水の中にいるようです", spoken: "今は圧倒されていて、水の中にいるような気分です" },
            { icon: "overload", text: "感覚の過負荷", spoken: "感覚的・精神的な過負荷を感じています、音や刺激が多すぎます" },
            { icon: "sad", text: "悲しいです", spoken: "悲しくて気分が落ち込んでいます" },
            { icon: "frustrated", text: "もどかしいです", spoken: "うまくコミュニケーションが取れなくて、とてももどかしいです" },
            { icon: "trapped", text: "頭の中に閉じ込められています", spoken: "自分の頭の中に閉じ込められているように感じます" },
            { icon: "hug", text: "抱きしめてほしいです", spoken: "体に触れてもらうか、ハグをして支えてほしいです" },
            { icon: "love", text: "大好きです", spoken: "大好きです" },
            { icon: "alone", text: "一人になりたいです", spoken: "しばらく静かに一人で過ごしたいです" }
        ]
    }
};

export { aacBoardData };
