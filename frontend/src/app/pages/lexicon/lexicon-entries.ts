import { LEXICON_TERMS } from './lexicon-terms';

export interface LexiconEntry {
    term: string;
    definition: string;
    example?: string;
}

type DefinitionData = Omit<LexiconEntry, 'term'>;

const RAW_DEFINITIONS = `2barrel	Deuxième mise effectuée au turn après avoir déjà misé le flop avec l'initiative.	Il cbet flop puis 2barrel sur une brique turn.
3b ou 3bet	Surrelance faite après une première relance preflop ou postflop.	UTG open, le bouton 3bet.
3barrel	Troisième mise consécutive, généralement river après avoir misé flop et turn.	Il 3barrel bluff sur une river effrayante.
3way	Coup joué à trois joueurs.	Le pot part 3way au flop.
4b ou 4bet	Relance faite par-dessus un 3bet.	CO open, BTN 3bet, SB 4bet.
4way	Coup joué à quatre joueurs.	La main se joue 4way après quatre calls preflop.
6-max	Table de poker limitée à six joueurs.	En 6-max, les ranges d'ouverture sont plus larges.
A-game	Meilleur niveau de jeu d'un joueur, quand ses décisions sont claires et disciplinées.	Après une pause, il retrouve son A-game.
Abattage	Moment où les joueurs encore en lice montrent leurs cartes pour déterminer le gagnant.	Deux joueurs arrivent à l'abattage après un check river.
ABC	Style simple, solide et standard, sans coups compliqués.	Contre un débutant, jouer ABC suffit souvent.
Académique	Se dit d'un coup joué de façon très standard ou théorique.	Le cbet sur ce board sec est académique.
Add-on	Rachat de jetons proposé à un moment précis d'un tournoi rebuy.	Il prend l'add-on à la pause.
AF	Initiales d'aggression factor, indicateur de fréquence d'agression.	Un AF élevé indique beaucoup de bets et raises.
Aggression factor	Ratio statistique mesurant l'agressivité d'un joueur via ses mises et relances.	Son aggression factor de 5 montre un profil très actif.
Aggro	Joueur ou ligne de jeu très agressive.	Cet aggro mise presque toutes les streets.
Agressif	Joueur qui mise et relance souvent plutôt que de suivre.	Un joueur agressif met la pression sur les ranges faibles.
AI	Abréviation de all-in, action de miser tous ses jetons.	Il shove AI avec top paire.
Air	Main sans valeur faite ni tirage réel.	Il mise avec air pour faire folder mieux.
AK Beginner's Big Bluff	Bluff typique avec As-Roi non amélioré, souvent surestimé par les débutants.	Il a AK sur 9-7-2 et continue à bluffer sans équité.
All-in	Action de mettre tous ses jetons au milieu.	Il part all-in avec deux paires.
Angle shooting	Comportement limite qui respecte parfois la lettre des règles mais cherche à tromper l'adversaire.	Faire semblant de folder pour lire une réaction peut être de l'angle shooting.
Ante	Mise obligatoire payée par tous les joueurs avant la distribution, fréquente en tournoi.	Les antes augmentent la pression sur les tapis.
Any two	N'importe quelles deux cartes de départ.	Au bouton, il peut voler avec any two contre des blinds trop serrées.
Any two cards	Expression complète de any two, n'importe quelles deux cartes.	Il shove any two cards avec une fold equity énorme.
Arc-en-ciel	Board contenant trois couleurs différentes au flop, donc sans tirage couleur immédiat.	K-8-2 rainbow est un flop arc-en-ciel.
ARJEL	Ancien régulateur français des jeux en ligne, devenu ANJ.	Les rooms agréées ARJEL étaient autorisées en France.
Assorti	Deux cartes de la même couleur.	As-Roi assorti a plus d'équité que As-Roi dépareillé.
ATC	Abréviation de any two cards.	Il steal ATC si les blinds overfold.
Auto-rebuy	Option qui recave automatiquement un joueur quand son tapis descend sous un seuil.	L'auto-rebuy remet la cave complète en cash-game.
Average	Tapis moyen d'un tournoi.	Il a 18 blindes alors que l'average est à 32 blindes.
b/3b	Abréviation de bet/3bet : miser puis surrelancer après une relance adverse.	Avec un gros tirage, il choisit b/3b flop.
b/c	Abréviation de bet/call : miser puis payer une relance.	Il bet/call avec top paire bon kicker.
b/f	Abréviation de bet/fold : miser puis folder face à une relance.	River, il préfère b/f en value thin.
Babie	Petite carte, surtout dans les variantes low comme Razz ou Stud Hi-Lo.	Un 3 est une babie très utile en Razz.
Backdoor	Tirage qui nécessite deux cartes favorables successives turn et river.	Il a backdoor flush avec deux cartes de pique à venir.
Bad beat	Coup perdu alors qu'on était largement favori au moment décisif.	AA perd contre 72 après un all-in preflop : bad beat.
Bad run	Période où les résultats sont mauvais malgré des décisions correctes.	Il traverse un bad run depuis deux semaines.
balancer	Répartir ses actions avec différentes mains pour ne pas être lisible.	Il balance ses check-raises avec value et bluffs.
Balla	Joueur qui dépense ou mise de grosses sommes, souvent avec une image flamboyante.	Il joue les high stakes comme un balla.
Bankroll	Capital total réservé au poker.	Sa bankroll de 2 000 euros lui permet de jouer la NL50.
Bankroll management	Gestion prudente de la bankroll pour limiter le risque de ruine.	Il descend de limite quand son bankroll management l'impose.
Barrel	Mise d'agression sur une street, souvent dans une séquence de bluff ou de value.	Il envoie un second barrel turn.
Bellybuster	Tirage quinte ventral, aussi appelé gutshot.	Avec 8-9 sur 5-7-K, le 6 donne bellybuster.
Bellybuster straight draw	Tirage quinte ventral nécessitant une seule valeur précise.	Avec A-2 sur 3-4-K, le 5 complète le bellybuster straight draw.
Bet	Mise volontaire faite quand personne n'a encore misé sur la street.	Il bet demi-pot au flop.
Bet sizing	Taille choisie pour une mise ou une relance.	Son bet sizing cher polarise sa range.
Bet/3bet	Miser puis surrelancer après avoir été relancé.	Il bet/3bet avec brelan sur board drawy.
Bet/call	Miser puis payer une relance adverse.	Il bet/call avec un tirage couleur max.
Bet/fold	Miser puis se coucher si l'adversaire relance.	Contre un nit, bet/fold river est standard.
Betting pattern	Schéma de mises révélant une tendance ou une force de main.	Son betting pattern ressemble à un tirage manqué.
Big bet	Grosse mise ; en limit, taille de mise utilisée sur les dernières streets.	En limit, la turn se joue en big bets.
Big blind	Blind la plus grosse, postée deux sièges après le bouton.	La big blind défend contre un open bouton.
Bilatéral	Tirage quinte ouvert par les deux bouts.	8-9 sur 6-7-2 donne un tirage bilatéral.
Blank	Carte qui ne change presque rien à la texture du board.	Le 2 de trèfle turn est une blank.
Blind	Mise obligatoire postée avant de recevoir les cartes.	La small blind et la big blind créent l'action preflop.
Blocker	Carte détenue qui réduit les combinaisons possibles chez l'adversaire.	Avoir l'As de pique bloque les flushs max.
Blocking bet	Petite mise destinée à contrôler le prix ou empêcher une grosse mise adverse.	Il fait un blocking bet river avec deuxième paire.
Bluff	Mise ou relance avec une main faible pour faire folder une main meilleure.	Il bluff river après avoir raté son tirage.
Bluff catcher	Main qui ne bat presque que les bluffs adverses.	Deuxième paire devient un bluff catcher river.
Board	Cartes communes visibles au centre de la table.	Le board A-K-7 favorise le relanceur initial.
Boat	Surnom anglais du full house.	Il fait boat river avec 77 sur 7-K-K-2-2.
Boîte	Expression française pour all-in.	Il envoie la boîte avec QQ.
Bombe	Main très forte ou mise massive selon le contexte.	Il touche une bombe avec carré au flop.
Bonus	Avantage promotionnel offert par une room, souvent libéré en jouant.	Il clear son bonus en cash-game.
Borderline	Décision très limite entre deux options proches.	Le call river est borderline.
Bot	Programme automatisé jouant au poker à la place d'un humain.	Les rooms cherchent à détecter les bots.
Bottom pair	Paire formée avec la plus petite carte du board.	Sur K-9-4, A4 fait bottom pair.
Bounty	Prime gagnée en éliminant un joueur dans un tournoi knockout.	Il call plus large grâce au bounty.
Bouton	Position du donneur, dernière à parler postflop.	Le bouton open beaucoup de mains.
Brag	Message ou attitude visant à se vanter d'un gain ou d'un coup.	Il poste un brag après son gros score.
Break even	Résultat neutre : ni gagnant ni perdant sur une période.	Il est break even sur 50 000 mains.
Brelan	Trois cartes de même valeur, souvent deux cartes fermées plus une carte du board pour un set.	Il floppe brelan avec 88 sur 8-5-2.
Brick	Carte sans impact apparent, équivalent de blank.	La river est une brick qui ne complète aucun tirage.
Bring-in	Mise forcée dans certaines variantes de stud, payée par une carte exposée précise.	En Stud, la plus petite carte peut payer le bring-in.
Brique	Carte sans effet important sur la main ou les tirages.	Le 2 river est une brique.
Broadway	Quinte hauteur As, ou carte haute de Dix à As selon le contexte.	A-K-Q-J-T est Broadway.
Broke	Être sans bankroll ou avoir perdu son tapis.	Il joue trop haut et finit broke.
Brûler	Écarter une carte du dessus du paquet avant de distribuer une street.	Le croupier brûle une carte avant le flop.
Bubble	Phase juste avant les places payées d'un tournoi.	À la bubble, les petits tapis subissent la pression.
Bulle	Version française de bubble.	Il bust à la bulle du tournoi.
Bully	Joueur qui agresse beaucoup les tapis plus faibles, surtout en tournoi.	Le chipleader joue le bully à la bulle.
Bumhunter	Joueur qui cherche principalement des adversaires faibles et évite les réguliers.	Il quitte la table dès que le fish part : vrai bumhunter.
Bust (out)	Être éliminé d'un tournoi ou perdre sa cave.	Il bust out avec AK contre QQ.
Buy-in	Montant nécessaire pour entrer dans un tournoi ou une partie.	Le buy-in du tournoi est de 50 euros.
bvb	Blind versus blind, coup joué entre small blind et big blind.	Les ranges bvb sont plus larges.
A chip and a chair	Expression indiquant qu'un joueur peut encore revenir même avec très peu de jetons.	Il lui reste une blinde : a chip and a chair.
c	Abréviation de call ou de check selon le contexte de notation.	Sur une hand history, c peut signifier call.
c/c	Abréviation de check/call.	Il joue c/c avec une main moyenne.
c/f	Abréviation de check/fold.	Sans équité, il choisit c/f turn.
c/r	Abréviation de check/raise.	Il c/r son brelan au flop.
c/rai	Abréviation de check/raise all-in.	Il c/rai avec tirage couleur max.
Cagoule	Grosse perte ou état de jeu très mauvais après un coup subi.	Après ce bad beat, il joue cagoulé.
Calling station	Joueur qui paye trop souvent et folde rarement.	Contre une calling station, bluffe moins et value plus.
Capé	Se dit d'une range qui ne contient presque plus les mains les plus fortes.	Après son check back turn, sa range est capée.
Carré	Quatre cartes de même valeur.	Il touche carré de Dames.
Carreau	Une des quatre couleurs du jeu de cartes, diamonds en anglais.	L'As de carreau bloque la couleur max.
Carte	Unité de base du jeu ; elle a une valeur et une couleur.	Chaque joueur reçoit deux cartes en Hold'em.
Cash out	Retrait d'argent d'une room ou option permettant de sécuriser une partie d'un pot.	Il cash out une partie de ses gains.
Cash-game	Partie où les jetons représentent directement de l'argent réel.	En cash-game, on peut recaver après une perte.
Casser (une table)	Fermer une table ou la quitter après avoir gagné/perdu.	La table casse quand il ne reste plus assez de joueurs.
Cave	Montant de jetons acheté pour s'asseoir à une table.	Il joue avec une cave de 100 blindes.
cb	Abréviation de continuation bet.	Il cb un tiers pot sur flop sec.
Cbet	Mise de continuation faite par l'agresseur de la street précédente.	Il open preflop puis cbet le flop.
cc	Abréviation de check/call ou indication de deux trèfles selon le contexte.	Il note le flop K72cc pour deux trèfles.
ccc	Notation indiquant trois cartes à trèfle sur le board.	Le board 9-7-2ccc donne beaucoup de flushs possibles.
cf	Abréviation de check/fold, parfois de coin flip selon le contexte.	Sans showdown value, il cf river.
Chasser	Payer dans l'espoir de compléter un tirage.	Il chasse la couleur malgré une mauvaise cote.
Check	Faire parole, c'est-à-dire ne pas miser quand c'est possible.	Il check pour contrôler le pot.
Check back	Checker en position après un check adverse.	Il check back turn avec deuxième paire.
Check behind	Synonyme de check back.	Il check behind pour prendre sa carte gratuite.
Check/call	Checker puis payer une mise adverse.	Il check/call avec top paire.
Check/fold	Checker puis se coucher face à une mise.	Il check/fold sans équité.
Check/raise	Checker puis relancer après une mise adverse.	Il check/raise un tirage très fort.
Chip	Jeton de poker.	Il empile ses chips après le pot gagné.
Chip count	Compte des tapis des joueurs dans un tournoi.	Le chip count le place troisième sur 120.
Chip dumping	Transfert volontaire et interdit de jetons à un autre joueur.	Le chip dumping est sanctionné par les rooms.
Chip race	Élimination des petits jetons devenus inutiles lors d'un tournoi.	Le chip race retire les jetons de 25.
Chip trick	Manipulation esthétique de jetons.	Il fait un chip trick en attendant sa main.
Chipleader	Joueur ayant le plus gros tapis d'un tournoi ou d'une table.	Le chipleader met la pression.
Click back	Min-raise ou petite relance immédiate sur une relance adverse.	Il click back le 3bet avec les As.
Close	Décision très serrée, proche de l'indifférence.	Le call est close contre cette range.
Clubs	Trèfles en anglais.	Deux clubs au flop donnent un tirage couleur.
CO	Abréviation de cut-off, position juste avant le bouton.	CO open à 2,5 blindes.
Cœur	Une des quatre couleurs du jeu, hearts en anglais.	Il a l'As de cœur.
Coin flip	Situation où deux mains ont une équité proche de 50/50.	AK contre QQ est souvent un coin flip.
Cold	Action faite sans avoir encore investi volontairement dans le coup.	Il cold call un 3bet depuis la big blind.
Cold deck	Rencontre inévitable entre deux très grosses mains.	Full contre carré est un cold deck.
Collusion	Entente interdite entre joueurs pour obtenir un avantage.	Partager ses cartes avec un complice est de la collusion.
Combinaison	Main finale ou ensemble de cartes formant une main.	La meilleure combinaison gagne à l'abattage.
Combo	Combinaison précise de cartes possibles dans une range.	Il reste six combos de brelan.
Combodraw	Main avec plusieurs tirages forts en même temps.	Tirage couleur plus quinte donne un combodraw.
Committed	Engagé dans le pot au point de ne presque plus pouvoir folder rationnellement.	Après sa mise, il est pot committed.
Connecteurs	Deux cartes dont les valeurs se suivent.	8-9 sont des connecteurs.
Connectors	Traduction anglaise de connecteurs.	Suited connectors jouent bien deep.
Continuation bet	Synonyme de cbet.	Il fait un continuation bet sur A-7-2.
Cooler	Rencontre entre deux mains très fortes où la perte est difficile à éviter.	KK contre AA preflop est souvent un cooler.
Cote d'amélioration d'une main	Probabilité ou ratio de toucher une carte améliorant la main.	Avec neuf outs, sa cote d'amélioration est intéressante.
Cote du pot	Rapport entre le montant à payer et la taille du pot.	Il call car la cote du pot est suffisante.
Cote implicite	Gain futur espéré si le tirage rentre.	Les petites paires ont de bonnes cotes implicites deep.
Cote implicite inversée	Risque de perdre plus quand on touche une main dominée.	Un petit tirage couleur peut avoir de mauvaises cotes implicites inversées.
Couleur	Cinq cartes de la même couleur.	Il touche couleur à pique river.
Courchevel	Variante proche de l'Omaha où une carte du flop est révélée avant l'action preflop.	En Courchevel, chaque joueur reçoit cinq cartes.
cr	Abréviation de check/raise.	Il cr flop avec set.
crai	Abréviation de check/raise all-in.	Il crai turn avec nuts.
Crazy Pineapple	Variante où les joueurs reçoivent trois cartes puis en défaussent une après le flop.	En Crazy Pineapple, on garde deux cartes après le flop.
Crippled	Se dit d'un joueur réduit à un très petit tapis.	Après ce pot perdu, il est crippled.
Croupier	Personne qui distribue les cartes et gère l'action en live.	Le croupier annonce all-in.
Crush	Dominer fortement une limite ou un adversaire.	Il crush la NL10.
Crushed	Être largement dominé par une meilleure main ou range.	AQ est crushed contre AK.
Crying call	Call fait à contrecœur, souvent en s'attendant à perdre mais avec une cote.	Il fait un crying call river.
Cut-off	Position située juste à droite du bouton.	Le cut-off open beaucoup quand le bouton est tight.
Se coucher	Abandonner sa main, fold.	Il se couche face au shove.
d	Notation de diamonds, carreaux.	Ad signifie As de carreau.
Dealer	Donneur ou position du bouton.	Le dealer parle en dernier postflop.
Dealer's Choice	Format où le donneur choisit la variante jouée.	En Dealer's Choice, il sélectionne Omaha.
Décaver	Prendre tous les jetons d'un adversaire ou perdre sa cave.	Il le décave avec couleur max.
deep	Avec un tapis profond en blindes.	Ils jouent deep à 200 blindes.
Deepstack	Structure ou situation avec beaucoup de blindes effectives.	Un tournoi deepstack laisse plus de jeu postflop.
Delayed cbet	Mise de continuation retardée, faite turn après avoir checké flop.	Il delayed cbet après le check flop.
Dépareillé	Deux cartes de couleurs différentes, offsuit.	As-Roi dépareillé a moins d'équité qu'assorti.
Déstacker	Prendre tout le tapis d'un joueur.	Il déstacke villain avec les nuts.
Diamond	Carreau en anglais.	Diamond indique la couleur carreau.
Dominé	Main qui partage une carte haute avec une meilleure main adverse et a peu d'outs propres.	AJ est dominé par AQ.
DoN	Abréviation de Double or Nothing.	En DoN, la moitié du field double son buy-in.
Donkbet	Mise faite hors de position dans l'agresseur de la street précédente.	Il donkbet flop dans le relanceur preflop.
Door card	Carte visible initiale en Stud.	La door card détermine parfois le bring-in.
Double bellybuster	Double tirage quinte ventral avec deux valeurs possibles.	Deux cartes différentes peuvent compléter son double bellybuster.
Double chance	Tournoi offrant deux caves de départ utilisables selon la structure.	Il garde sa deuxième chance pour plus tard.
Double or Nothing	Sit & Go où la moitié des joueurs double son buy-in et l'autre moitié ne gagne rien.	Le format Double or Nothing récompense la survie.
Double Shootout	Tournoi shootout en deux étapes, où il faut gagner sa table puis une table finale.	Il gagne sa table dans un Double Shootout.
Double up	Doubler son tapis.	Il double up avec AA contre KK.
Double-suited	En Omaha, main contenant deux possibilités de couleurs avec deux paires de couleurs.	A♠K♠Q♥J♥ est double-suited.
Doublette	Carte du board qui paire une valeur déjà présente.	La doublette du Roi rend les fulls possibles.
Downswing	Période prolongée de pertes.	Il traverse un downswing malgré un bon volume.
Draw	Tirage, main qui doit s'améliorer pour devenir forte.	Il joue un flush draw agressivement.
Drawing dead	Ne plus avoir aucune carte permettant de gagner.	Avec couleur contre full, il est drawing dead.
Drawmaha	Variante mélangeant Omaha et poker fermé à tirage.	Drawmaha combine board commun et draw.
Drawy	Board riche en tirages.	9-8-7 avec deux cœurs est très drawy.
Droit de chaise	Frais demandé pour s'asseoir ou rester dans certaines parties live.	Le cercle prélève un droit de chaise.
Dry	Board sec avec peu de tirages.	A-7-2 rainbow est dry.
DS	Abréviation de double-suited.	En PLO, une main DS gagne en jouabilité.
Early	Position précoce à la table.	En early position, on ouvre plus serré.
Écart-type	Mesure statistique de dispersion des résultats, liée à la variance.	Un écart-type élevé rend les swings plus grands.
Edge	Avantage technique ou stratégique sur les adversaires.	Son edge vient du jeu postflop.
Embuscade	Trappe consistant à jouer une grosse main passivement pour laisser miser l'adversaire.	Il tend une embuscade avec les As.
En position	Agir après son adversaire postflop.	En position, il peut contrôler la taille du pot.
Enchère	Mise ou relance dans une séquence d'action.	L'enchère minimale est la big blind.
Équité	Part du pot qu'une main ou range peut espérer gagner en moyenne.	Son tirage couleur a environ 35 % d'équité au flop.
Equity	Traduction anglaise d'équité.	AK a une bonne equity contre une paire moyenne.
EV	Espérance de gain moyenne d'une décision.	Un call EV+ rapporte sur le long terme.
EV-	Décision perdante en moyenne.	Payer hors cote est EV-.
EV+	Décision gagnante en moyenne.	Shove avec fold equity peut être EV+.
EV$	Espérance exprimée en argent réel.	Le move gagne 12 euros d'EV$.
EV0	Décision neutre en espérance.	Un spot EV0 ne gagne ni ne perd à long terme.
Extérieur	Out situé à une extrémité d'un tirage quinte ouvert.	Sur 6-7-8-9, un 5 ou un T est extérieur.
Face up	Se dit d'une range ou d'une main devenue évidente.	Son check/fold turn rend sa range face up.
Facteur d'agressivité	Traduction d'aggression factor.	Son facteur d'agressivité est très bas.
Faite	Main déjà constituée, par opposition à un tirage.	Il protège une main faite contre les draws.
Familiale	Pot joué par beaucoup de joueurs.	Le limp général crée une main familiale.
Family pot	Pot multiway avec une grande partie de la table impliquée.	Six joueurs voient le flop : family pot.
Fancy play (syndrom)	Tendance à chercher des lignes trop compliquées au lieu de jouer simplement.	Son bluff inutile relève du fancy play syndrom.
FD	Abréviation de flush draw, tirage couleur.	Il shove FD plus deux overcards.
Fear equity	Pression psychologique exercée par une mise qui fait craindre l'élimination ou une grosse perte.	À la bulle, son shove gagne en fear equity.
Fear factor	Facteur de peur ou pression ressentie face à un gros tapis ou une mise.	Le fear factor bloque les petits tapis.
Fee	Frais prélevés par l'organisateur, distincts du prize pool.	Un tournoi 10+1 a 1 euro de fee.
Feeler bet	Petite mise destinée à prendre de l'information ou tester la force adverse.	Il fait un feeler bet au flop.
Fish	Joueur faible ou très exploitable.	Le fish call trop large river.
Fit or fold	Style consistant à continuer seulement quand le flop améliore la main.	Il joue fit or fold hors de position.
Fixed Limit	Format où les tailles de mises sont fixes.	En Fixed Limit, on ne peut pas shove.
FL	Abréviation de Fixed Limit.	Il joue FL Hold'em.
Flashé	Carte accidentellement vue par un ou plusieurs joueurs.	Une carte flashée peut être remplacée selon les règles.
Flat call	Call simple d'une relance, sans surrelancer.	Il flat call le 3bet avec JJ.
Flip	Synonyme de coin flip.	Il gagne le flip AK contre QQ.
Float, floating	Payer avec une main faible pour bluffer sur une street suivante.	Il float flop pour miser turn si villain check.
Floor	Responsable de salle appelé pour trancher une décision.	Le floor intervient après une erreur de donne.
Floor manager	Responsable opérationnel d'une salle de poker.	Le floor manager valide la décision.
Flop	Trois premières cartes communes en Hold'em et Omaha.	Le flop vient A-9-4.
Flopper	Toucher une main au flop.	Il floppe top paire.
Flush	Couleur, cinq cartes de la même couleur.	Il gagne avec flush à l'As.
Flush draw	Tirage couleur.	Il a flush draw avec deux cœurs au flop.
Fold	Se coucher et abandonner le pot.	Il fold face au 4bet.
Fold equity	Probabilité de faire folder l'adversaire multipliée par le gain du pot.	Son semi-bluff a beaucoup de fold equity.
For info	Mise faite supposément pour obtenir de l'information, souvent concept stratégique discutable.	Il bet for info avec une main moyenne.
Four of a kind	Carré.	Four of a kind bat full house.
FPS	Abréviation de fancy play syndrome.	Il souffre de FPS au lieu de value simplement.
FR	Abréviation de Full Ring.	En FR, les ranges early sont serrées.
Freeroll	Tournoi gratuit ou situation où l'on ne peut pas perdre mais peut gagner plus.	Il joue un freeroll réservé aux membres.
Freezeout	Tournoi sans rebuy ni re-entry.	Une fois bust en freezeout, c'est terminé.
Full	Main composée d'un brelan et d'une paire.	Il fait full avec 888KK.
Full bring-in	Mise complète dans les variantes Stud après un bring-in partiel.	Il complète en full bring-in.
Full house	Nom anglais du full.	Full house bat couleur.
Full Ring	Table complète de 9 ou 10 joueurs.	Le Full Ring est plus serré que le 6-max.
Gamble	Prendre un spot très high variance ou jouer de manière risquée.	Il gamble avec un tirage faible.
Gaper	Cartes connectées avec un écart.	7-9 suited est un one-gaper.
GG	Good game, formule de félicitations ou de fin de partie.	GG après son élimination.
GL	Good luck, bonne chance.	GL à la table finale.
Good run	Période où les cartes et résultats sont favorables.	Il est en good run depuis le début du tournoi.
Grind	Jouer régulièrement avec volume pour générer du profit.	Il grind la NL25 chaque soir.
Grosse blind	Big blind en français.	La grosse blind poste 2 euros.
GS	Abréviation de gutshot.	Il call avec GS et overcards.
Gutshot	Tirage quinte ventral nécessitant une valeur précise.	Avec 5-6 sur 8-9-A, le 7 donne gutshot.
h	Notation de hearts, cœurs.	Ah signifie As de cœur.
Hand history	Historique textuel d'une main jouée en ligne.	Il poste la hand history pour analyse.
Hand improvement odds	Cote d'amélioration d'une main.	Il compare ses hand improvement odds à la cote du pot.
Hand range	Ensemble des mains possibles d'un joueur.	Sa hand range contient beaucoup d'As.
Handgrabber	Outil qui récupère automatiquement les historiques de mains.	Le handgrabber importe les mains dans le tracker.
Hauteur	Main sans paire, classée par sa carte la plus haute.	Il gagne hauteur As.
HE	Abréviation de Hold'em.	Le NLHE est du No Limit Hold'em.
Heads up	Face-à-face entre deux joueurs.	Ils arrivent heads up en finale.
Heart	Cœur en anglais.	Heart indique la couleur cœur.
Heater	Période très favorable où un joueur gagne beaucoup.	Il est en heater sur les tournois du dimanche.
Hero	Joueur dont on analyse la main.	Hero est au bouton avec AQ.
Hero call	Call difficile avec une main moyenne pour attraper un bluff.	Il hero call hauteur As.
Hero fold	Fold difficile d'une main forte mais probablement battue.	Il hero fold brelan sur un board très dangereux.
HH	Abréviation de hand history.	Poste la HH pour analyse.
hhh	Notation indiquant trois cœurs sur le board.	Le flop K72hhh est monocolore cœur.
Hi-Jack	Position située deux sièges avant le bouton en table pleine.	Le Hi-Jack open plus large que UTG.
Hi-Lo	Variante où le pot peut être partagé entre meilleure main haute et meilleure main basse.	En Omaha Hi-Lo, on joue high et low.
High	Main haute ou partie haute d'un pot partagé.	Il gagne le high avec couleur.
High stakes	Limites élevées.	Les high stakes demandent une grosse bankroll.
High-Low	Synonyme de Hi-Lo.	Le Stud High-Low partage parfois le pot.
High-roller	Tournoi à très gros buy-in.	Il s'inscrit au high-roller à 10 000 euros.
Hit and run	Quitter la table rapidement après avoir gagné un gros pot.	Il double puis part : hit and run.
HJ	Abréviation de Hi-Jack.	HJ open à 2 blindes.
Hole card	Carte fermée privative d'un joueur.	En Hold'em, chaque joueur a deux hole cards.
Hors (de) position	Agir avant l'adversaire postflop.	Hors position, il check plus souvent.
HU	Abréviation de heads up.	Il joue HU contre le chipleader.
HUD	Affichage statistique d'un tracker superposé aux tables online.	Le HUD montre le VPIP adverse.
ICM	Modèle évaluant la valeur monétaire des jetons en tournoi selon les paliers de gains.	L'ICM rend certains calls trop risqués.
Implied odds	Cotes implicites.	Il call une petite paire pour ses implied odds.
In the dark	Action annoncée avant de voir la carte suivante.	Il check in the dark avant le flop.
In the money	Être dans les places payées d'un tournoi.	Il est enfin in the money.
Independant Chip Model	Nom complet de l'ICM, modèle d'évaluation des tapis en tournoi.	L'Independant Chip Model pèse les décisions à la bulle.
Insta-	Préfixe indiquant une action immédiate.	Il insta-call avec les nuts.
Iso-raise	Relance destinée à isoler un limper ou un joueur faible.	Il iso-raise le fish au cut-off.
ITM	Abréviation de in the money.	Il bust ITM.
Jinx (card)	Carte réputée porter malchance ou changer défavorablement la dynamique.	La Dame river est sa jinx card habituelle.
Kicker	Carte d'accompagnement départageant deux mains de même paire.	AQ bat AJ sur A-7-2 grâce au kicker.
Knockout, knock-out	Tournoi où éliminer un joueur rapporte une prime.	En knockout, les bounties changent les ranges de call.
KO	Abréviation de knockout.	Il joue un tournoi KO progressif.
LAG	Loose agressif : joueur qui joue beaucoup de mains agressivement.	Un LAG met la pression postflop.
Large	Joueur qui entre dans beaucoup de coups, loose.	Il défend une range large en big blind.
Last longer	Pari annexe où gagne celui qui survit le plus longtemps dans un tournoi.	Ils font un last longer entre amis.
Lay down	Fold, souvent d'une main forte.	Il trouve un lay down avec deux paires.
Lead	Miser en premier dans une street.	Il lead turn après avoir check/call flop.
Leak	Faiblesse récurrente dans le jeu d'un joueur.	Son gros leak est de trop call river.
Light	Action faite avec une main plus faible que la normale.	Il 3bet light contre un open bouton.
ligne	Séquence d'actions choisie sur une main.	Sa ligne bet/check/bet représente souvent de la value.
Limp	Payer seulement la big blind preflop sans relancer.	Il limp au lieu d'open raise.
Linetard	Argot péjoratif pour un joueur online jugé mauvais ; à éviter hors citation.	Il traite son adversaire de linetard après un mauvais call.
Livetard	Argot péjoratif pour un joueur live caricatural ou jugé faible ; à éviter hors citation.	Le terme livetard décrit surtout un cliché de joueur live.
LL	Abréviation de last longer.	Ils organisent un LL sur le tournoi.
Lobby	Interface listant les tables et tournois disponibles sur une room.	Il cherche le tournoi dans le lobby.
Lockout	Situation où la main favorite s'améliore et retire quasiment tous les outs adverses.	Le turn donne full et crée un lockout.
Longshot	Tirage ou résultat très improbable.	Toucher runner-runner carré est un longshot.
Loose	Joueur qui joue beaucoup de mains.	Un joueur loose open trop large UTG.
Luckbox	Joueur qui semble gagner grâce à beaucoup de chance.	Il touche toutes les rivers, vraie luckbox.
M	Indicateur de tournoi : tapis divisé par le coût d'une orbite.	Avec un M de 5, il doit prendre des risques.
Main	Cartes détenues par un joueur ou combinaison finale.	Sa main est paire de Rois.
Main event	Tournoi principal d'une série.	Le main event attire le plus gros field.
Max	Maximum autorisé, souvent pour la cave ou le nombre de joueurs.	La cave max est de 100 blindes.
Merger	Miser une range fusionnée contenant des mains moyennes et fortes, non polarisée.	Il merge sa range avec top paire bon kicker.
Metagame	Dynamique stratégique liée à l'historique et à l'image entre joueurs.	Le metagame rend son 4bet plus crédible.
Micro stakes	Très petites limites.	Il débute en micro stakes.
Middle position	Position intermédiaire entre early et late.	En middle position, il ouvre 77+.
Middle stakes	Limites moyennes entre micro/low et high stakes.	La NL400 fait partie des middle stakes.
Milk	Extraire lentement de la value avec une très grosse main.	Il milk son full avec une petite mise river.
Misclick	Clic involontaire en ligne.	Il min-raise par misclick.
Monstre	Main extrêmement forte.	Il slowplay un monstre au flop.
Montante	Partie ou limite supérieure à celle jouée habituellement.	Il tente une montante en NL100.
Mourant	Joueur avec un tapis presque nul.	Il est mourant avec deux blindes.
Move	Action agressive ou créative pour gagner le pot.	Il tente un move contre une range capée.
MP	Abréviation de middle position.	MP open à 2,2 blindes.
MTT	Multi-table tournament, tournoi à plusieurs tables.	Il grind les MTT le dimanche.
Muck	Jeter ses cartes face cachée ou zone des cartes mortes.	Il muck après avoir été payé.
Multitable tournament	Tournoi multi-table.	Un multitable tournament commence avec plusieurs centaines de joueurs.
Multiway	Coup impliquant au moins trois joueurs.	Top paire perd de la valeur multiway.
Narrow (the field)	Réduire le nombre d'adversaires dans le coup par une relance.	Il raise pour narrow the field.
New York back raise	Ligne consistant à cold call puis surrelancer après un squeeze.	Il piège avec AA en New York back raise.
nh	Nice hand, compliment après une main gagnée.	nh après son hero call.
Nit	Joueur très serré, souvent trop prudent.	Un nit 4bet presque toujours très fort.
Niveau	Limite de blindes en tournoi ou échelon de compétence.	Le niveau passe à 1 000/2 000.
NL	Abréviation de No Limit.	Il joue en NL.
NLHE	No Limit Hold'em.	Le NLHE est la variante la plus jouée.
NLx	Notation d'une limite de No Limit Hold'em, où x indique souvent la cave maximale en centimes ou dollars.	NL50 correspond souvent à blindes 0,25/0,50.
No brainer	Décision évidente.	Call les nuts river est un no brainer.
No flop no drop	Règle de rake : pas de prélèvement si aucun flop n'est vu.	La room applique no flop no drop.
No Limit	Format où un joueur peut miser jusqu'à tout son tapis.	En No Limit, le shove est autorisé.
Nosebleed	Limites extrêmement hautes.	Les nosebleeds opposent les meilleurs joueurs.
Nut flush draw	Tirage couleur max.	Avec l'As de pique et deux piques au flop, il a nut flush draw.
Nut straight draw	Tirage vers la meilleure quinte possible.	Son tirage donne toujours les nuts s'il rentre.
Nuts	Meilleure main possible à un instant donné.	Sur A-K-Q-J-T sans couleur, Broadway est les nuts.
Nutsé, e	Se dit d'une main qui correspond aux nuts.	Sa couleur max est nutsée.
NYBR	Abréviation de New York back raise.	Il NYBR avec les As.
o	Notation offsuit, cartes dépareillées.	AKo signifie As-Roi offsuit.
obv	Abréviation d'obvious, évident.	Obv call avec les nuts.
OC	Abréviation d'overcard.	AK a deux OC sur 7-5-2.
OESD	Open-ended straight draw, tirage quinte ouvert.	8-9 sur 6-7-A donne OESD.
Off	Cartes non assorties.	AK off est moins fort qu'AK suited.
Offsuit	Dépareillé, cartes de couleurs différentes.	AJo offsuit est plus fragile que AJs.
oop	Out of position, hors position.	Il joue oop contre le bouton.
Open limp	Entrer dans le coup preflop en limpant alors que personne n'a encore joué.	UTG open limp.
Open raise	Première relance preflop d'un coup.	Le bouton open raise à 2 blindes.
Option	Droit de relancer pour la big blind si personne n'a relancé.	La big blind a l'option.
Orbite	Tour complet de table où chaque joueur paie les blinds une fois.	Il perd 3 blindes par orbite.
OTB	On the button, au bouton.	Il est OTB avec KQs.
Out	Carte susceptible d'améliorer la main pour gagner.	Il a neuf outs pour la couleur.
Out of position	Hors position.	Out of position, il préfère check.
Outdraw	Battre une main favorite en touchant une carte favorable.	Il outdraw AA avec une quinte river.
Outplay	Surclasser un adversaire par de meilleures décisions.	Il l'outplay postflop.
Overbet	Mise supérieure à la taille du pot.	Il overbet river avec range polarisée.
Overcall	Payer après qu'un autre joueur a déjà payé.	Il overcall en big blind.
Overcard	Carte plus haute que toutes les cartes du board, ou carte de main plus haute que le board.	AK a deux overcards sur 9-7-2.
Overlay	Situation où la valeur ajoutée dépasse le coût, souvent avec garantie non couverte.	Le tournoi a de l'overlay.
Overpair	Paire en main plus haute que toutes les cartes du board.	QQ sur 9-6-2 est une overpair.
+ (plus)	Notation indiquant une range incluant cette main et toutes les meilleures.	TT+ signifie TT, JJ, QQ, KK et AA.
Package	Lot gagné ou acheté pour un événement, incluant buy-in et parfois frais.	Il gagne un package pour le main event.
Parole	Check en français.	Il fait parole au flop.
Passif	Joueur qui mise et relance peu, préférant suivre.	Un joueur passif call beaucoup.
Pat	Main servie dans les variantes à tirage, qui ne demande pas de carte.	Il stand pat avec une main faite.
pb	Abréviation de pot bet.	Il pb flop avec les nuts.
Peel (a flop)	Payer une mise au flop pour voir la turn, souvent avec équité modérée.	Il peel avec deux overcards.
pf	Abréviation de preflop.	Il 3bet pf.
PFR	Preflop raise, statistique de fréquence de relance preflop.	Son PFR de 18 indique un joueur actif.
Pique	Une des quatre couleurs du jeu, spades en anglais.	L'As de pique bloque la flush max.
PL	Abréviation de Pot Limit.	En PL, la mise max est le pot.
PLO	Pot Limit Omaha.	Le PLO se joue avec quatre cartes privatives.
Pocket pair	Paire servie en main.	77 est une pocket pair.
Poker face	Expression neutre destinée à ne pas donner d'information.	Il garde sa poker face après avoir touché les nuts.
Polariser	Miser ou construire une range composée surtout de très fortes mains et de bluffs.	Son overbet polarise sa range.
Position	Ordre de parole relatif à la table ou à un adversaire.	La position donne un avantage d'information.
Postflop	Tout ce qui se passe après le flop.	Son jeu postflop est solide.
Pot	Montant total des jetons à gagner dans le coup.	Le pot fait 40 blindes.
Pot bet	Mise égale à la taille du pot.	Il pot bet turn.
Pot control	Contrôle de la taille du pot avec une main moyenne.	Il check back pour pot control.
Pot equity	Part théorique du pot détenue par une main ou range.	Son pot equity est élevée avec tirage combo.
Pot extérieur	Pot secondaire disputé par des joueurs ayant encore des jetons après un all-in.	Un pot extérieur se crée après le shove du shortstack.
Pot familial	Family pot, pot joué par beaucoup de joueurs.	Cinq limpers créent un pot familial.
Pot Limit	Format où la mise maximale est la taille du pot.	L'Omaha se joue souvent en Pot Limit.
Pot odds	Cote du pot.	Ses pot odds justifient le call.
Pot parallèle	Side pot, pot secondaire.	Le pot parallèle oppose les deux gros tapis.
Pot size bet	Mise de la taille du pot.	Il fait pot size bet sur un board très drawy.
Pot size raise	Relance maximale autorisée en Pot Limit, calculée à la taille du pot.	En PLO, il choisit pot size raise.
Poubelle	Main de départ très faible.	7-2 offsuit est une poubelle.
pp	Abréviation de pocket pair.	Il setmine avec pp.
Preflop	Phase de jeu avant le flop.	La décision preflop est un fold.
Prize pool	Cagnotte totale distribuée aux joueurs payés d'un tournoi.	Le prize pool atteint 50 000 euros.
Probe bet	Mise faite hors position après que l'agresseur précédent a checké.	Il probe bet turn après le check back flop.
psb	Abréviation de pot size bet.	Il psb river.
psr	Abréviation de pot size raise.	Il psr flop en PLO.
Push	Mettre son tapis, shove.	Il push 12 blindes au bouton.
Push or fold	Stratégie de tournoi consistant à shove ou fold avec un petit tapis.	À 8 blindes, il joue push or fold.
Push-fold	Synonyme de push or fold.	Le tableau push-fold conseille shove A8s.
Quads	Carré en anglais.	Il hit quads au turn.
Quinte	Cinq cartes consécutives.	5-6-7-8-9 est une quinte.
Quinte flush	Cinq cartes consécutives de la même couleur.	7-8-9-T-J de cœur fait quinte flush.
Quinte flush royale	Quinte flush de Dix à As.	La quinte flush royale est la meilleure main possible.
r	Abréviation de raise dans une notation de main.	La ligne b/r signifie bet puis raise.
Rail	Espace autour d'une table ou fait de suivre un joueur sans jouer.	Ses amis sont au rail.
Railbird	Spectateur régulier d'une partie.	Les railbirds regardent la table finale.
Rainbow	Arc-en-ciel, board de couleurs différentes.	Le flop K-8-2 rainbow est sec.
Raise	Relancer une mise.	Il raise à 9 blindes.
Raiser	Relanceur, joueur qui effectue une relance.	Le raiser initial cbet.
Rake	Prélèvement de la room ou du casino sur les pots ou inscriptions.	Le rake réduit le winrate.
Rakeback	Retour d'une partie du rake payé.	Le rakeback améliore ses résultats mensuels.
Range	Ensemble de mains possibles attribuées à un joueur.	Sa range contient beaucoup de broadways.
Razz	Variante de Stud où la plus basse main gagne.	En Razz, A-2-3-4-5 est excellent.
Re-entry	Possibilité de se réinscrire à un tournoi après élimination.	Il prend une re-entry.
Rebuy	Rachat de jetons dans un tournoi ou recave.	Il rebuy après avoir bust.
Reg	Régulier, joueur expérimenté fréquentant une limite.	Le reg 3bet beaucoup au bouton.
Relancer	Augmenter la mise précédente.	Il relance le limp.
Reraise	Surrelancer après une relance.	Il reraise avec KK.
Resteal	Surrelance contre une tentative de vol, souvent depuis les blinds.	La big blind resteal contre le bouton.
Result oriented	Analyse trop centrée sur le résultat plutôt que sur la qualité de la décision.	Dire que le call est mauvais parce qu'il a perdu est result oriented.
Reverse float, reverse floating	Bluff différé hors position après avoir check/call puis misé plus tard.	Il reverse float turn après avoir payé flop.
Reverse hand history	Main racontée en inversant les rôles hero/villain pour éviter les biais d'analyse.	Il poste une reverse hand history.
Rigged	Truqué, souvent utilisé à tort après un bad beat.	Il crie rigged après avoir perdu AA.
Risk/reward	Rapport entre le risque pris et le gain potentiel.	Le risk/reward du bluff est favorable.
River	Cinquième et dernière carte commune.	La river complète la couleur.
Rivière	Traduction française de river.	Il mise cher rivière.
ROI	Return on investment, rendement moyen en tournoi.	Son ROI MTT est de 18 %.
RoR	Risk of ruin, risque de ruine de bankroll.	Un mauvais bankroll management augmente le RoR.
Round	Tour d'enchères ou rotation de jeu.	Le round de mise est terminé.
Royal flush	Quinte flush royale.	Royal flush bat toutes les mains.
Run (something) twice	Distribuer deux boards après un all-in pour réduire la variance.	Ils acceptent de run it twice.
Rundown	En Omaha, main composée de cartes consécutives ou proches.	J-T-9-8 est un bon rundown.
Runner-up	Deuxième d'un tournoi.	Il finit runner-up du main event.
Runner(-)runner	Toucher deux cartes successives nécessaires pour compléter une main.	Il gagne runner-runner couleur.
Rush	Période courte de grosses mains ou gros gains.	Il est en rush depuis une heure.
s	Notation suited, cartes assorties ; peut aussi noter spades selon le contexte.	AKs signifie As-Roi suited.
Sandbag	Sous-jouer une main forte pour piéger.	Il sandbag les As preflop.
Satellite	Tournoi qualificatif donnant accès à un événement plus cher.	Il gagne un satellite pour le main event.
Scared money	Argent joué avec peur, au point de mal décider.	Il joue scared money à cette limite.
Scary board	Board dangereux qui favorise des mains fortes ou tirages rentrés.	A-K-Q monochrome est un scary board.
Scary card	Carte qui change fortement la texture et peut effrayer une range.	Le troisième pique turn est une scary card.
Scooper (un pot)	Gagner la totalité du pot, surtout en variantes split.	En Omaha Hi-Lo, il scoop le pot avec high et low.
SD	Abréviation de showdown ou standard deviation selon le contexte.	Il va au SD avec deuxième paire.
Semi-bluff	Mise ou relance avec une main non faite mais ayant de l'équité.	Il semi-bluff son tirage couleur.
Serré	Joueur qui joue peu de mains.	Un joueur serré open UTG très fort.
Set	Brelan formé avec une pocket pair et une carte du board.	Il floppe set avec 55 sur A-5-2.
Set mining	Payer avec une petite paire pour essayer de toucher un set.	Il set mine deep contre un open UTG.
Set-up	Rencontre de mains très fortes difficile à éviter, proche d'un cooler.	Set over set est un set-up.
SH	Short-handed, table à peu de joueurs.	Le SH demande des ranges plus larges.
Ship it	Expression pour pousser les jetons ou célébrer un pot gagné.	Il gagne le pot et lance ship it.
Shooter une limite	Tenter une limite supérieure à son niveau habituel.	Il shoot la NL100 avec 5 caves dédiées.
Shootout	Tournoi où il faut gagner sa table pour passer au tour suivant.	Il avance au round 2 du shootout.
Short-handed	Table avec peu de joueurs, souvent six ou moins.	Le short-handed favorise l'agression.
Shortstack	Petit tapis.	Le shortstack shove 8 blindes.
Shortstacker	Joueur qui choisit volontairement de jouer avec un petit tapis.	Le shortstacker buy-in à 40 blindes.
Shot	Tentative ponctuelle à une limite supérieure.	Il prend un shot en NL200.
Shove	Mettre tapis.	Il shove preflop avec AK.
Showdown	Abattage.	Il gagne au showdown avec paire de Dix.
Showdown value	Valeur d'une main qui peut gagner à l'abattage sans miser.	Deuxième paire a de la showdown value.
Shuffle up and deal	Annonce lançant le début du jeu après mélange et distribution.	Le directeur annonce shuffle up and deal.
Side bet	Pari annexe hors du pot principal.	Ils font un side bet sur le dernier survivant.
Side pot	Pot secondaire créé quand un joueur est all-in et que d'autres continuent.	Le side pot oppose les deux gros tapis.
Sit & Go	Tournoi à nombre fixe de joueurs qui démarre quand la table est pleine.	Il lance un Sit & Go à 9 joueurs.
Sit and Go	Synonyme de Sit & Go.	Le Sit and Go démarre dès l'inscription complète.
Sit'n Go	Autre écriture de Sit & Go.	Il grind les Sit'n Go hyper turbo.
Sizing	Taille de mise choisie.	Son sizing river vise à être payé par top paire.
Skin	Version commerciale d'une room sur un même réseau.	Deux skins partagent les mêmes tables.
Slowplay	Jouer passivement une main forte pour laisser l'adversaire miser.	Il slowplay brelan sur board dry.
Slowroll	Tarder volontairement à payer ou montrer une main gagnante évidente, comportement mal vu.	Il slowroll les nuts, ce qui agace la table.
Small ball	Style utilisant de petites mises et beaucoup de petits pots.	Il adopte un style small ball deepstack.
Smooth call	Call avec une main forte au lieu de relancer, pour masquer sa force.	Il smooth call AA contre un 3bet.
Snap	Action immédiate.	Il snap-call avec les nuts.
SnG	Abréviation de Sit'n Go.	Il joue des SnG jackpot.
Softplaying	Jouer volontairement moins agressivement contre un ami ou complice, interdit en tournoi.	Ne pas miser contre son ami peut être du softplaying.
Sooted	Écriture humoristique de suited, souvent utilisée dans le jargon forum.	Il plaisante avec one-gaper sooted.
Spades	Piques en anglais.	Three spades signifie trois piques.
Spew	Gaspiller des jetons avec des actions trop larges ou impulsives.	Il spew river avec un bluff impossible.
Spewtard	Argot péjoratif pour un joueur qui spew beaucoup ; à éviter hors citation.	Ce spewtard shove trop de mains.
spewy	Se dit d'une action trop dépensière en jetons.	Son call river est spewy.
Split	Partage du pot entre plusieurs joueurs.	La même quinte provoque un split.
Squeeze (play)	Surrelance après une relance et au moins un call, pour punir l'argent mort.	CO open, BTN call, SB squeeze.
ss	Notation indiquant deux piques sur le board, ou shortstack selon contexte.	K72ss indique deux piques.
sss	Notation indiquant trois piques sur le board.	A83sss est un board monocolore pique.
Stab	Mise tentée dans un pot que personne ne semble vouloir gagner.	Il stab turn après deux checks.
Stack	Tapis d'un joueur.	Son stack effectif est de 40 blindes.
Staking	Financement d'un joueur par un investisseur contre une part des gains.	Il vend du staking pour le festival.
Stand pat	Ne pas changer de carte dans une variante à tirage.	Il stand pat avec une main faite.
Standard deviation	Écart-type, mesure de dispersion des résultats.	La standard deviation explique de gros swings.
Steal	Tentative de vol des blinds par une relance tardive.	Le bouton steal avec K5s.
Steaming	État proche du tilt, avec colère visible et décisions dégradées.	Après le bad beat, il est steaming.
Stop and go	Ligne consistant à payer preflop puis miser directement sur le flop.	Il stop and go avec 10 blindes.
Stop loss	Limite de perte fixée avant d'arrêter une session.	Son stop loss est de trois caves.
Str8	Notation abrégée de straight, quinte.	Il écrit str8 dans le chat.
Straddle	Mise optionnelle live avant distribution, souvent double de la big blind.	Le straddle rend le pot plus gros preflop.
Straight	Quinte.	Straight bat brelan.
Straight draw	Tirage quinte.	Il a straight draw au flop.
Straight flush	Quinte flush.	Straight flush bat carré.
Straightforward	Style direct et lisible, sans pièges complexes.	Il joue straightforward en value.
Street	Tour de mise : preflop, flop, turn ou river.	Il mise trois streets.
String bet	Mise faite en plusieurs mouvements non autorisés en live.	Le croupier refuse son string bet.
Structure	Répartition des niveaux, blindes et tapis d'un tournoi.	La structure lente favorise les joueurs techniques.
Suckout	Gagner en touchant une carte improbable alors qu'on était derrière.	Il suckout river avec deux outs.
Suit	Couleur d'une carte.	Le suit de l'As est pique.
Suite	Séquence de cartes consécutives, quinte.	Il complète sa suite au turn.
Suited	Assorti, deux cartes de même couleur.	KQs est suited.
Surblind	Grosse blind, blind supérieure.	La surblind agit en dernier preflop si personne ne relance.
Surrelance	Relance faite après une relance.	Le 3bet est une surrelance.
Swap	Échange de pourcentages entre joueurs, surtout en tournoi.	Ils swap 5 % avant le tournoi.
Swing	Variation positive ou négative de bankroll.	Il subit un swing de dix caves.
Tableau	Board, ensemble des cartes communes.	Le tableau affiche A-K-7-2-2.
TAG	Tight agressif : joueur serré mais agressif.	Un TAG open peu mais cbet souvent.
Taille	Sizing ou montant d'une mise/tapis selon contexte.	La taille du pot influence son call.
Tank	Prendre beaucoup de temps pour réfléchir.	Il tank deux minutes river.
Tapis	Stack total d'un joueur ; faire tapis signifie all-in.	Il met son tapis au milieu.
Tell	Indice physique ou comportemental révélant une information.	Son tremblement est peut-être un tell.
Tête à tête	Heads up, duel entre deux joueurs.	Ils jouent le trophée en tête à tête.
Texture	Structure du board : sec, connecté, drawy, pairé, etc.	La texture favorise la big blind.
Thin (value bet)	Mise de value fine avec une main seulement légèrement devant la range de call.	Il thin value bet deuxième paire.
Three of a kind	Brelan en anglais.	Three of a kind bat deux paires.
Tight	Serré, joueur ou range qui sélectionne peu de mains.	Un joueur tight défend peu sa big blind.
Tilt	État émotionnel qui dégrade les décisions.	Il tilt après deux bad beats.
Tilter	Entrer en tilt.	Il commence à tilter et spew.
Time bank	Réserve de temps supplémentaire en ligne.	Il utilise sa time bank river.
Timing tell	Indice donné par la vitesse d'action.	Son snap-check peut être un timing tell.
Tirage	Draw, main qui doit toucher une carte pour s'améliorer.	Il paie avec un tirage couleur.
Tournant	Turn, quatrième carte commune.	Le tournant complète la quinte.
TPTK	Top pair top kicker.	AQ sur Q-7-2 donne TPTK.
Tracker	Logiciel qui enregistre les mains et produit des statistiques.	Son tracker affiche 24/19.
Trap	Piège consistant à sous-jouer une main forte.	Il trap avec les As.
Trashtalking	Provocation verbale à la table ou dans le chat.	Le trashtalking peut pousser un joueur au tilt.
Trèfle	Une des quatre couleurs du jeu, clubs en anglais.	L'As de trèfle bloque la couleur.
Tricky	Joueur ou ligne difficile à lire.	Ce reg tricky check/raise des bluffs.
Trips	Brelan formé avec une paire sur le board et une carte en main.	A7 sur 7-7-K donne trips.
Turn	Quatrième carte commune.	Il mise turn après avoir cbet flop.
Twice	Se réfère à run it twice : distribuer deux issues après un all-in.	Ils run twice pour réduire la variance.
UI	Abréviation d'unimproved, main non améliorée.	Il fold turn si UI.
ul	Abréviation d'unlucky, malchanceux.	ul après son bad beat.
Under the gun	Première position à parler preflop après les blinds.	UTG open une range serrée.
Underdog	Main ou joueur statistiquement défavori.	76s est underdog contre AA.
Unlucky	Malchanceux.	Il est unlucky sur cette river.
Upswing	Période prolongée de gains.	Il profite d'un upswing de 20 caves.
UTG	Abréviation de under the gun.	UTG relance à 2,5 blindes.
UTG+1	Position juste après UTG.	UTG+1 doit rester assez tight.
UTG+2	Position deux sièges après UTG.	UTG+2 open un peu plus large que UTG.
Value bet	Mise faite pour être payée par moins bien.	Il value bet top paire river.
Value cut	Mise de value qui se retourne contre soi car seules de meilleures mains paient.	Il value cut deuxième paire contre une range forte.
Variance	Écart entre résultats courts termes et espérance mathématique.	La variance explique qu'un bon joueur puisse perdre sur 10 000 mains.
VGG	Very good game, très bien joué.	VGG pour sa victoire.
Villain	Adversaire dans une main analysée.	Villain call au bouton.
Vol	Tentative de steal des blinds ou d'un pot.	Son vol bouton passe souvent.
VPIP	Voluntarily put money in pot, statistique de mains jouées volontairement.	Un VPIP de 45 indique un joueur loose.
wa/wb	Way ahead / way behind : très devant ou très derrière, rarement entre les deux.	Top paire kicker moyen est wa/wb sur ce board.
Walk	Quand tout le monde fold et la big blind gagne sans jouer.	Il reçoit un walk en big blind.
Way ahead/way behind	Situation où une main domine largement ou est largement dominée.	AQ sur A-7-2 contre une range tight est souvent way ahead/way behind.
Weak	Faible ou passif.	Son check river montre une range weak.
Whine	Se plaindre, souvent de la variance.	Il whine après chaque bad beat.
Winner-takes-all	Structure où seul le premier gagne tout.	Le sit & go winner-takes-all paie uniquement le vainqueur.
wp	Well played, bien joué.	wp après son bluff réussi.
Wraparound	En Omaha, gros tirage quinte avec de nombreux outs autour du board.	Sur 9-8-2, JT76 a un wraparound.
WSOP	World Series of Poker, série de tournois majeure à Las Vegas.	Il rêve de jouer les WSOP.
x	Carte inconnue ou sans importance dans une notation.	Sur A-K-x, la troisième carte n'est pas précisée.`;

const DEFINITION_MAP = new Map<string, DefinitionData>(
    RAW_DEFINITIONS.split('\n').map((line) => {
        const [term, definition, example] = line.split('\t');
        return [term, { definition, example }];
    })
);

export const LEXICON_ENTRIES: LexiconEntry[] = LEXICON_TERMS.map((term) => {
    const data = DEFINITION_MAP.get(term);

    return {
        term,
        definition: data?.definition ?? 'Définition à compléter.',
        example: data?.example
    };
});
