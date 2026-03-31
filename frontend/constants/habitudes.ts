export type ScoreTier = "missing" | "low" | "medium" | "high";

export type ScoreContent = 
{
    forYou: string;
    cardBody: string;
}

export type Habitude = 
{
    id: string;
    description: string;
    color: string;
    secondaryColor: string;
    scoreContent: Record<ScoreTier,ScoreContent>
    advantages: string[],
    disadvantages: string[],
}
export const getScoreTier = (score: number): ScoreTier => {
    if(score === 0)
        return "missing";
    if(score <= 3)
        return "low";
    if(score <= 6)
        return "medium";
    return "high";
};
const SpontaneousCardBody = 
    "Typically, when you have money, your first thought is what could you do with that money right now. " +
    `You'll likely see a gift, bonus, tax return or inheritance as "extra" money and use it for more immediate needs or wants instead of putting it toward a long-term goal. `+
    "Being spontaneous with money and in life is wonderful. You can enjoy the moment. You can take advantage of opportunities and take risks. " +
    "Your spontaneity will bring enthusiasm and energy to a situation. But, acting quickly can also mean jumping into things too quickly. "+
    "You may find you've made commitments without doing enough research. "+
    "You may not consider how your money choices will affect others or what will happen long-term. "+
    "You may sacrifice reaching your goals for a fleeting, less valued use of your money. "

const GivingCardBody = 
    "Typically, when you have money, your first thought is about how that money could be used to help others. "+
    "It could mean anything from giving a handout to a homeless person, paying your adult child's bills or donating money to a charity. "+
    "It could be giving to meet someone's basic needs (like food or shelter) or giving non-essentials (like buying another toy for a child who has lots of toys). "+
    "This giving tendency could be: "+
    "- informal, like responding in the moment to a person's need. "+
    "- formal, like tithing or writing annual checks to specific organizations. "
        

const PlanningCardBody= 
    "Typically, when you have money, your first thought is about how it could be used to reach your goals or accomplish something you've been planning.\n"+
    "That may mean:\n"+
        "- Putting it toward saving for a house, car, or future event.\n"+
        "- Paying a bill.\n"+
        "- Giving it to a person or organization you plan to help.\n"+
        "- Investing in yourself.\n"+
        "- Making a financial investment.\n"+
        "Whatever you choose to do with money, it fits into a plan.\n"+
        "- It may be formal like a financial plan, a budget, or written goals.\n"+
        "- It may also be informal and something you've thought about but haven't written down.\n"+
        `Note that *having a plan* for your money doesn't mean that it is necessarily *an effective plan for long-term financial success*. `

const CarefreeCardBody=
    "Typically, when you have money, you don't really think about what you would do with it. You may let someone else make the decision or just let it slide. That may mean: "+
       "- Taking a wait-and-see attitude until more information is available. "+
       "- Waiting until you think the timing is better. "+
       "- Avoiding, denying or ignoring issues that need to be addressed or actions that should be taken. "

const StatusCardBody=
    "Typically, when you have money choices, you first think about how you can use money to make a positive impression on others. "+
    "That may mean spending your money to do something that will help you fit in or stand out in way that is important to you. "+
    "For some, it can mean using money to live up to an image of being successful. For others, it could be creating an image that minimizes how much you actually have. "+
    "It may also mean presenting an image that is different than your reality, but helps you fit into a particular situation. " +
    "Caring about what others think is important so you can be appropriate. "
       


export const HABITUDES: Habitude[] = [
    {
      id: "Spontaneous",
      description: "Money encourages you to enjoy the moment. ",
      color: "#E31422",
      secondaryColor: "#AF0C17",
      advantages: 
      [
        "Make intentional financial decisions based on values and desired long-term outcomes. ",
        "Have money reserved to pay for the unexpected. ",
        "Set and accomplish goals. ",
        "Buy items you really want that will retain value. ",
        "Have a sense of well-being and control. "
      ],
      disadvantages: 
      [
        "Feel pressured by others to spend money on things that do not fit your budget or values. ",
        "Expected to help others who did not plan",
        "Have difficulty responding to new opportunities if it means changing or abandoning your plan. ",
        "Intolerant or impatient when others do not meet your standards or have different values. ",
        "Hide or withhold information from significant others to stay in control of the money. "
      ],
      scoreContent: 
      {
        missing: {
          forYou: "For you, Spontaneous is an unused Habitude. This indicates it isn't your priority right now. ",
          cardBody: `When you sorted your cards, you didn't put any Spontaneous cards in your "That's Me" pile. ` +
            "Not having any cards in this category may be intentional because you are very cautious about how you spend your money. "+
            "Not having any of these cards may also be unintentional. "+
            "Without thinking about it, you may plan so much or are so careful that you don't allow yourself to do anything spontaneously. "+
            `The question is would it be beneficial for you to use the Spontaneous Habitude more? Look at the "Advantages" section to see the benefits of using this Habitude more. `
        },
        low: {
          forYou: "You are using the Spontaneous Habitude in moderation. ",
          cardBody: "You can quickly take advantage of a good deal for something you've been planning to get. "+
           "In some situations you react without thinking of the long-term consequences. "+  
          "You may jump in and take calculated risks. But, in other situations you jump in without assessing the risk or consequences. "
          
        },
        medium: {
          forYou: "For you, Spontaneous is a dominant Habitude. That means your first thought when you get money will be to use it to let you enjoy the moment. ",
          cardBody: SpontaneousCardBody
        },
        high: {
          forYou: "For you, Spontaneous is a dominant Habitude and falls within a strong range. Be aware of indicators that you are overusing this Habitude and may be jumping into financial and life situations without adequately considering the consequences. ",
          cardBody: SpontaneousCardBody
        },
      },
    },
    {
        id: "Giving",
        description: "Money helps you feel good by giving to others. ",
        color: "#60B334",
        secondaryColor: "#468724",
        advantages: 
        [
          "Have strong values and convictions",
          "Generously give to other people or causes. ",
          "Live simply to reflect non-materialistic values. ",
          "Act ethically and with integrity. ",
          "Be needed; others depend on you. ",
          "Be appreciated for being thoughtful. ",
          "Be admired for being able to anticipate others' needs. "
        ],
        disadvantages: 
        [
          "Disappointed if money or gifts are not appreciated. ",
          "May have unrealistic expectations that others will repay your generosity. ",
          "Use giving as a form of control to impose your personal values on others. ",
          "Intolerant of people who have different lifestyles. ",
          "Resent when giving is expected and assumed. ",
          "Promote dependence or irresponsible behavior by giving too much or too often. ",
          "Sacrifice your needs or future security for others",
        ],
        scoreContent: 
        {
            missing: 
            { 
                forYou: "For you, Giving is an unused Habitude. This indicates it isn't your priority right now. ", 
                cardBody: `When you sorted your cards, you didn't put any Giving cards in your "That's Me" pile. `+
                "Not having any cards in this category may be intentional. You may be in a situation where your resources are focused on meeting your own needs. "+
                "Or, philosophically, you may not believe in giving to others. "+
                "Not having any of these cards may also be unintentional. Without thinking about it, you have given more priority to other things. "+
                `The question is would it be beneficial for you to use the Giving Habitude more? Look at the "Advantages" section to see the benefits of this Habitude. `
                
    
            },
            low:     
            { 
                forYou: "You are using the Giving Habitude in moderation. ", 
                cardBody: "You like to give to others and make choices depending on the situation. "+
                "- You may like to give and have a plan and a system to give gifts as appropriate. "+
                "- You may want to be more generous and are being careful to strike a balance with your needs. "+
                "- You may not really care that much about giving but do it as necessary or required. "
                
            },
            medium:  
            { 
                forYou: "For you, Giving is a dominant Habitude. That means your first thought when you get money will be to use it to help others. ", 
                cardBody: GivingCardBody
            
            },
            high:    
            { 
                forYou: "For you, Giving is a dominant Habitude and falls within a strong range. Be alert to indications that you may be overusing this Habitude by giving too often or too much. ", 
                cardBody: GivingCardBody
            },
        },
    },
    {
        id: "Planning",
        description: "Money helps you achieve your goals",
        color: "#21428F",
        secondaryColor: "#1C3778",
        advantages: 
        [
            "Make intentional financial decisions based on values and desired long-term outcomes. ",
            "Have money reserved to pay for the unexpected. ",
            "Set and accomplish goals. ",
            "Buy items you really want that will retain value. ",
            "Have a sense of well-being and control. "
        ],
        disadvantages: [
            "Feel pressured by others to spend money on things that do not fit your budget or values. ",
            "Expected to help others who did not plan. ",
            "Have difficulty responding to new opportunities if it means changing or abandoning your plan. ",
            "Intolerant or impatient when others do not meet your standards or have different values. ",
            "Hide or withhold information from significant others to stay in control of the money. "
            ],
        scoreContent: 
        {
          missing: 
          { 
            forYou: "For you, Planning is an unused Habitude. This indicates it isn't your priority right now. ", 
            cardBody: `When you sorted your cards, you didn't put any Planning cards in your "That's Me" pile. `+
            "Not having any cards in this category may be intentional because you already have a plan and it's working. "+
            "Not having any of these cards may also be unintentional. Without thinking about it, you have given more priority to other things. "+
           `The question is: Would you benefit from using the Planning Habitude more? Look at the "Advantages" section to see benefits of using this Habitude more. `
          },
          low: 
          { 
            forYou: "You are using the Planning Habitude in moderation. ", 
            cardBody: "You have a plan or some ideas of what is important to you. "+
            "- You may be well on your way so Planning is not a strong focus for you. "+
            "- You may have plans but don't necessarily think of them first when you have money to spend. "+
            "- You may find you don't give your plans enough priority to make them happen. "+
            "- Other demands on your time and money always seem to cause delays and obstacles. " 
          },
          medium: 
          { 
            forYou: "For you, Planning is a dominant Habitude. That means your first thought when you get money is to think how it fits into your plans. ", 
            cardBody: PlanningCardBody
          },
          high: 
          { 
            forYou: "For you, Planning is a dominant Habitude and falls within a strong range. Planning is your first thought when you receive money. You may act on it without considering other choices. ", 
            cardBody: PlanningCardBody
          },
        },
    },
    {
        id: "Carefree",
        description: "Money isn't a priority. You just let life happen. ",
        color: "#FFDE0D",
        secondaryColor: "#D6BA0A",
        advantages: 
        [
            "Be optimistic that everything will work out. ",
            "Respond quickly to new opportunities. ",
            "Not be distracted by money considerations or details. ",
            "Easily share what you have with others. ",
            "Not feel pressured by others' expectations. "
        ],
        disadvantages: 
        [
            "Lack the skills and information to feel confident. ",
            "Unable to support yourself if the person(s) providing for you cannot continue or chooses to stop. ",
            "Feel trapped or obligated by being supported. ",
            "Miss opportunities by avoiding commitments or missing deadlines. ",
            "Lose track of money or possessions. ",
            "Frustrated by how often things don't work out as expected. "
        ],
        scoreContent: {
          missing: { 
            forYou: "For you, Carefree is an unused Habitude. This indicates it isn't your priority right now. ", 
            cardBody: `When you sorted your cards, you didn't put any Carefree cards in your "That's Me" pile. `+
            "Not having any cards in this category may be intentional because of a situation you've experienced. "+
            "Not having any of these cards may also be unintentional. "+
            "Without thinking about it, you may be so stuck on a plan or so serious about what is important to you that you're very demanding on yourself. "+
            "Maybe you aren't able to relax and go with the flow. Maybe you're not open to trying new ways or allowing others to help you or give you support. "+
            `The question is: Would you benefit from using the Carefree Habitude more? Look at the "Advantages" section to see benefits of using this Habitude more. `
          },
          low: { 
            forYou: "You are using the Carefree Habitude in moderation. ",
            cardBody: "You can let things go and be flexible at times. "+
            "- You may clearly differentiate between what is important and be responsible, but not give much attention to things that are unimportant to you. "+
            `- You may make some decisions "just because" without having any concern about the money involved. `+
            "- You may procrastinate or not pay enough attention to details and necessary responsibilities when making financial choices. "
            
             
          },
          medium: { 
            forYou: "For you, Carefree is a dominant Habitude. You don't want to think or worry about money. ", 
            cardBody: CarefreeCardBody 
          },
          high: { 
            forYou: "For you, Carefree is a dominant Habitude and falls within a strong range. Watch for indications that you may be too unconcerned with your finances. ", 
            cardBody: CarefreeCardBody 
          },
        },
      
    },
    {
        id: "Security",
        description: "Money helps you feel safe and in control. ",
        color: "#787878",
        secondaryColor: "#616060",
        advantages: 
        [
            "Confidence from spotting risks that others may miss. ",
            "Comfort in knowing you have money or protections ready when needed. ",
            "Relief in understanding your safety net. ",
            "Have control when quick action keeps your money safe. ",
            "Ease in thinking through “what if” situations before deciding. ",
            "Trust when your instincts guide you in uncertain moments. ",
        ],
        disadvantages: 
        [
            "Worry about money even when it is safe. ",
            "Be so cautious that you miss out on good chances. ", 
            "Feel like you never have “enough” to be secure. ", 
            "Hide or keep secrets about money to protect it. ", 
            "Spend too much energy focusing on risks instead of enjoying life. ",
            "Find it hard to relax or trust others with money decisions. ",
        ],
        scoreContent: 
        {
          missing: 
          { 
            forYou: "For you, Security is an unused Habitude. Feeling safe with money may not be a focus for you right now. ", 
            cardBody: "When you sorted your cards, you didn’t put any Security cards in your “That’s Me” pile. "+
            "Not having any cards in this category may be intentional. You may feel comfortable with uncertainty or believe that other strategies, like Planning, already give you enough confidence. "+
            "It may also mean you haven’t thought much about what makes you feel financially safe. "+
            "The question is: Would you benefit from adding more awareness of financial risks and safety? Look at the “Advantages” section to see how using Security more could help. " 
          },
          low: { 
            forYou: "You are using the Security Habitude in moderation. You notice risks at times, but money safety is not your main concern. ", 
            cardBody: "When you selected a few Security cards, it suggests you are aware of financial risks but do not let them dominate your decisions. "+
            "You may feel safe enough most of the time, with occasional worries about money. "+
            "This balance can help you prepare for the unexpected without being weighed down by too much fear. "+ 
            "The key is noticing when your concerns are helpful — and when they might keep you from feeling confident and free. " 
          },
          medium: { 
            forYou: "For you, Security is a dominant Habitude. Your first thought with money is often about staying safe and in control. ", 
            cardBody: "For you, Security is a dominant Habitude. That means your first thought with money is often about safety, control, and protection. " +
            "You may worry about financial risks and look for ways to create certainty. " +
            "This can give you peace of mind and a strong sense of control. " +
            "But it may also keep you on alert more often than needed. " +
            "Think about whether your focus on security helps you feel stable — or whether it sometimes gets in the way of enjoying your money. "
          },
          high: { 
            forYou: "For you, Security is a strong Habitude. You focus heavily on safety and control, so be mindful not to let worry take over. ", 
            cardBody: "For you, Security is a very strong Habitude. Your instinct is to use money as a way to feel safe, reduce worry, and stay in control. "+
            "This can make you cautious and protective — qualities that can serve you well. "+
            "However, high Security may also lead to overusing this Habitude: worrying about money even when it is safe, holding on too tightly, or missing opportunities because of fear. "+
            "The question is: How is your strong sense of Security working for you right now? "+
            "Look at both the “Advantages” and “Challenges” to see whether your high Security is helping you feel safe — or keeping you from feeling free. "
          },
        },
    
    },
    {
        id: "Status",
        description: "Money helps you present a positive image",
        color: "#9E3C8E",
        secondaryColor: "#6C175E",
        advantages: 
        [
            "Present a strong first impression. ",
            "Make generous donations. ",
            "Give expensive or unexpected gifts. ",
            "Be attentive to what is important to others. ",
            "Never burden others about money problems. ",
            "Be appreciated for generosity and helping others. ",
            "Enjoy others returning favors and being generous. ",
        ],
        disadvantages: 
        [
            "Create a false impression of having wealth. ",
            "Feel constant stress to keep up with others. ",
            "Do not have reserves for the unexpected. ",
            "Spend money unwisely to maintain appearances. ",
            "Feel entitled to special treatment. ",
            "Actions motivated by personal gain may be seen as suspicious and insincere; people may feel used. ",
            "Keep money secrets because of the fear of losing friends or status if others knew your real financial situation. "

        ],
        scoreContent: 
        {
          missing: 
          { 
            forYou: "For you, Status is an unused Habitude. This indicates it isn't your priority right now. ", 
            cardBody: `When you sorted your cards, you didn't put any Status cards in your "That's Me" pile. `+
            "Not having any cards in this category may be intentional. "+
            "You may not be particularly concerned with the impression you make on others. "+
            "Or, you may be comfortable with the people in your life and don't feel you need to impress them. "+
            "Not having any of these cards may also be unintentional. "+
            "You don't consider what others think of you as important. "+
            "Therefore, you don't pay attention to what is important to them or make an effort to fit in by trying to meet their expectations. "+
            `The question is would it be beneficial for you to use the Status Habitude more? Look at the "Advantages" section to see benefits of using this Habitude more. ` 
          },
          low: { 
            forYou: "You are using the Status Habitude in moderation. ", 
            cardBody: "You care about what people think but don't feel you need to go out of your way to impress others. "+
            "- You are usually aware of what is appropriate behavior for a situation. This could be buying a gift or how you dress. "+
            "- You either have chosen to be with people that have the same priorities as you, or you are comfortable choosing to be different. "
             
          },
          medium: { 
            forYou: "For you, Status is a dominant Habitude. That means your first thought when you get money will be to use it to make a positive impression. ", 
            cardBody: StatusCardBody
          },
          high: { 
            forYou: "For you, Status is a dominant Habitude and falls within a strong range. That means when you get money, your first thought will be to use it to make a positive impression. Be alert to indications that you may be overusing this Habitude and trying too hard to make a positive impression. ", 
            cardBody: StatusCardBody 
          },
        },
      },
    ];
