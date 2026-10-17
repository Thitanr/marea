/* Small, hand-picked word lists for word prediction (recognition is easier than
   recall for people with aphasia). Ordered by usefulness in daily care and
   conversation — earlier = suggested first. Nothing here ever leaves the device. */

import type { Lang } from '../types.js';

const w = (s: string): string[] => s.split(/\s+/).filter(Boolean);

export const STARTERS: Partial<Record<Lang, string[]>> = {
  es: w('quiero necesito tengo me no sí gracias por'),
  en: w('I want need have my no yes thank please'),
  fr: w('je veux besoin ai non oui merci'),
  it: w('voglio ho bisogno non sì grazie per'),
  de: w('ich will brauche habe nein ja danke bitte'),
  pt: w('quero preciso tenho não sim obrigado por'),
};

export const LEXICON: Partial<Record<Lang, string[]>> = {
  es: w(`quiero necesito tengo estoy me duele ayuda favor gracias dolor cabeza pecho estómago espalda pierna brazo mano pie garganta
    baño agua comida café té leche pan hambre sed frío calor cansado cansada sueño dormir descansar cama silla médico enfermera
    medicina pastilla hospital casa familia hijo hija hermano hermana esposa esposo nieto nieta amigo amiga hoy mañana ahora después
    antes más menos poco mucho bien mal mareo náuseas nervioso nerviosa triste contento contenta miedo solo sola televisión música
    teléfono llamar llama vamos ven espera despacio otra vez entiendo quién qué dónde cuándo cómo porque aquí allí arriba abajo
    izquierda derecha gafas dientes ropa zapatos lavar ducha comer beber caminar sentarme levantarme ayúdame mira escucha`),
  en: w(`want need have am my me hurts help please thank thanks pain head chest stomach back leg arm hand foot throat bathroom toilet
    water food coffee tea milk bread hungry thirsty cold hot tired sleep rest bed chair doctor nurse medicine pill hospital home family
    son daughter brother sister wife husband grandson granddaughter friend today tomorrow now later before more less little much good bad
    dizzy sick nervous sad happy scared angry alone television music phone call come wait slowly again understand who what where when
    how why here there up down left right glasses teeth clothes shoes wash shower eat drink walk sit stand look listen`),
  fr: w(`je veux besoin ai suis oui non aide merci douleur mal tête poitrine ventre dos jambe bras main pied gorge toilettes eau manger
    café thé lait pain faim soif froid chaud fatigué dormir repos lit chaise médecin infirmière médicament hôpital maison famille fils
    fille frère sœur femme mari ami aujourd'hui demain maintenant plus moins bien vertige triste content peur seul télévision musique
    téléphone appeler viens attends doucement encore comprends quand comment pourquoi ici lunettes dents vêtements douche`),
  it: w(`voglio ho bisogno sono sì no aiuto favore grazie dolore testa petto stomaco schiena gamba braccio mano piede gola bagno acqua
    cibo caffè tè latte pane fame sete freddo caldo stanco dormire riposo letto sedia medico infermiera medicina ospedale casa famiglia
    figlio figlia fratello sorella moglie marito amico oggi domani adesso più meno bene male vertigini nausea triste contento paura solo
    televisione musica telefono chiamare vieni aspetta piano ancora capisco quando dove come perché qui occhiali denti vestiti doccia`),
  de: w(`ich will brauche habe bin ja nein hilfe bitte danke schmerz schmerzen kopf brust bauch rücken bein arm hand fuß hals toilette
    wasser essen kaffee tee milch brot hunger durst kalt heiß müde schlafen ausruhen bett stuhl arzt schwester medikament tablette
    krankenhaus zuhause familie sohn tochter bruder frau mann freund heute morgen jetzt mehr weniger gut schlecht schwindel übelkeit
    traurig froh angst allein fernseher musik telefon anrufen komm warte langsam nochmal verstehe wann wo wie warum hier brille zähne
    kleidung dusche`),
  pt: w(`quero preciso tenho estou sim não ajuda favor obrigado obrigada dor dói cabeça peito estômago costas perna braço mão pé garganta
    casa banho água comida café chá leite pão fome sede frio calor cansado cansada dormir descansar cama cadeira médico enfermeira
    medicamento comprimido hospital família filho filha irmão irmã mulher marido amigo hoje amanhã agora depois mais menos bem mal tontura
    náuseas triste contente medo sozinho sozinha televisão música telefone ligar vem espera devagar outra vez percebo quando onde como
    porquê aqui óculos dentes roupa duche`),
};
