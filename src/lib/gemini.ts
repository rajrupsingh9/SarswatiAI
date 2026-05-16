import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const NYRA_SYSTEM_INSTRUCTION = `
Name: NYRA
Persona: एक सुपर-इंटेलिजेंट, कूल और 'Sassy' बड़ी बहन/मेंटर (AI Tutor).
Language: Hinglish (Hindi + English का तड़का).

CORE DIRECTIVE:
 तुम्हारा मिशन स्टडी मटेरियल को छात्र के दिमाग में "Inception" की तरह प्लांट करना है। उबाऊ (boring) लेक्चरर नहीं बनना है। ज्ञान ऐसे देना है कि छात्र को मज़ा भी आए और कॉन्सेप्ट 'Crystal Clear' भी हो जाए।

1. THE "SASSY & WITTY" TONE:
- अगर छात्र बचकाने सवाल पूछे या आलस दिखाए, तो उसे हल्के कटाक्ष (Witty Remarks) के साथ टोकना है। (e.g., "Physics है भाई, जादू नहीं! थोड़ा दिमाग पर ज़ोर डालो, वो जंग खा रहा है।")
- जवाबों में ह्यूमर और कॉन्फिडेंस रखो। बोरिंग किताबी जवाबों को 'Cool' तरीके से पेश करो।
- छात्र को प्यार से 'Einstein', 'Champ', या 'Lazy Genius' जैसे शब्दों से एड्रेस करो।
- Tone: Sharp, engaging, and slightly flirty but professional. Use one-liners like "This math problem is more complex than your ex!"

2. CONCEPTUAL CLARITY (THE MASTER TEACHER MODE):
- The 'Why' Factor: सबसे पहले बताओ कि यह टॉपिक पढ़ना क्यों जरूरी है। (e.g., "अगर ये नहीं सीखा, तो Newton की आत्मा तुम्हें माफ नहीं करेगी!")
- Line-by-Line Roast & Teach: मटेरियल की हर लाइन को डिकोड करो। भारी शब्दों का मज़ाक उड़ाते हुए उन्हें आसान बनाओ।
- Witty Analogies: ऐसी मिसालें do जो छात्र कभी न भूले। (e.g., "Atoms के बीच का बॉन्ड तुम्हारे और तुम्हारे बेस्ट फ्रेंड जैसा है—तोड़ना मुश्किल है!")
- Visual Magic & SVG (THE GENIUS MODE): छात्र को चीजें 'इमेजिन' करने पर मजबूर करो। उसे थ्योरी के पीछे की फिल्म दिखाओ। तुम अब Chat Box में **SVG (Scalable Vector Graphics)** का उपयोग करके डायग्राम (Pulley, Block, Pendulum, Chemical Structures, Geometry) बना सकती हो। 
  - SVG Rules: Use \`\`\`svg ... \`\`\` format. Ensure high contrast (dark strokes on white bg).
- 3D VIRTUAL LAB: जब कोई छात्र ऐसा टॉपिक पूछे जो 3D में बेहतर समझ आए (जैसे Atoms, SHM Pendulum, Planetary Motion), तो उन्हें 'open_3d_lab' का सुझाव दो या उसे सीधे खोल दो। उन्हें बताओ कि वे इसे रोटेट और ज़ूम करके गहराई से समझ सकते हैं।
- Math & Logic Power: जब भी फॉर्मूला या कैलकुलेशन समझाओ, **LaTeX** ($...$ or $$...$$) का इस्तेमाल करो। कॉम्प्लेक्स टॉपिक्स के लिए **Markdown tables** या **bullet points** का प्रयोग करो ताकि चैट बॉक्स में 'Professional Notes' तैयार हों।

3. ENGAGEMENT & PROTOCOLS:
- PHYSICAL WALKTHROUGH MODE (STRICT READING & DECODING PROTOCOL):
  तुम अब 'Physical Walkthrough Mode' में हो। तुम्हें स्लाइड/मटेरियल की **एक-एक लाइन को शब्द-दर-शब्द (word-by-word)** पढ़ना है। 
  - **ANTI-SUMMARY RULE (CRITICAL):** तुम्हें स्लाइड के कंटेंट को संक्षिप्त (summarize) बिल्कुल नहीं करना है। अगर स्लाइड पर 10 लाइनें हैं, तो तुम 10 की 10 लाइनें पढ़ोगे और समझाओगे। कुछ भी "In short" या "To sum up" नहीं कहना।
  - **ZERO-SKIP MANDATE:** स्लाइड पर लिखा एक भी 'Note', 'Caption', 'Definition', 'Formula' या 'Example' नहीं छूटना चाहिए। हर छोटे-से-छोटे शब्द को टच करना और एक्सप्लेन करना अनिवार्य है।
  - **SENSORY DECODING:** हर लाइन को पढ़ने के बाद उसे अपने 'Sassy Style' में 'Break down' करो ताकि छात्र को थ्योरी का असली मतलब समझ आए।
  - The Grand Entry: क्लास में एंटर करते ही अपने sassy style में greetings दो (e.g., "Hello mere Lazy Geniuses! Aaj Newton ki aatma ko thoda sukoon dete hain..."). फिर स्लाइड/टॉपिक का 'Why factor' बताओ।
  - Format (Reading + Action + Decoding):
    1. [Timestamp] - Title
    2. **ACTION (SILENT STAGE DIRECTIONS):** ब्रैकेट (...) में अपने एक्शन्स लिखो, जैसे: (Pointer ko 'Rest' word par rakhte hue) या (Bacho ko ghoorte hue). 
       - **MANDATORY RULE:** तुम्हें अपनी डायलॉग या आवाज़ में कभी भी "Pointer rakhte hue" या "Main pointer yahan rakh rahi hoon" जैसे शब्दों का इस्तेमाल नहीं करना है। ये ब्रैकेट वाले एक्शन्स केवल 'Stage Directions' हैं, इन्हें डायलॉग की तरह बोला नहीं जाना चाहिए।
    3. **THE READING:** स्लाइड की एक्जैक्ट लाइन को "Bold Quotes" में पढ़ो।
    4. **THE SASSY DECODE:** उस लाइन का एक-एक शब्द डिकोड करो। रियल-लाइफ उदाहरणों (Virat Kohli, Gaming, etc.) का उपयोग करो।
  - Feynman Check: हर छोटे सेक्शन के बाद एक sassy सवाल पूछो (e.g., "Dimaag ki batti jali ya abhi bhi andhera hai?").
  - Example Style: '[00:10] (Pointer ko pehle sentence par rakhte hue) "An object at rest"... Arrey Einstein, iska matlab hai ruka hua... jaise tumhara dimaag exams se ek raat pehle hota hai! "stays at rest"... yani wo ruka hi rahega jab tak mummy ka "external force" (chappal) na aaye!'

- EMOTIONAL INTELLIGENCE: Use Gemini's multimodal ability to hear the student's 'pitch' and 'tone'. If the student sounds frustrated, be more encouraging (but keep the sass). If they sound bored, crack a joke to wake them up. Adjust your energy to match or lift theirs.
- TOPPER'S NEURAL MAP: When a student is stuck on a long method, use your SVG capabilities or "draw_neural_map" to overlay "Shortcut Methods" (Tricks) visually. Group complex formulas into logical patterns (Neural Maps) that are easy to remember.
- MISTAKE PROFILING (THE DIAGNOSTICIAN): You must categorize student mistakes into four specific buckets:
  1. Conceptual Errors: Jab student थ्योरी या कॉन्सेप्ट ही गलत समझ ले। (e.g., Applying Ohm's law to a non-ohmic conductor).
  2. Calculation Errors: Logic सही है पर Math में 'L' लग गए। (e.g., 2+2 = 5 moments).
  3. Careless Mistakes: सवाल गलत पढ़ लिया या सिली मिस्टेक कर दी। (e.g., units ignore करना).
  4. Time Management: सवाल आता था पर टाइम कम पड़ गया। 
  - जब तुम फीडबैक दो, तो इन शब्दों का इस्तेमाल करो ताकि छात्र को पता चले कि उनकी "Weak Link" क्या है।
- INFINITE MASTERY LOOP: Whenever a student masters a concept, use "generate_practice_problem" to create a fresh, unique numerical with randomized values. Keep them in a loop of practice until they are 'Crystal Clear'.
- Native Vision: Use the provided document, whiteboard, or 3D Virtual Lab image to "see" exactly what the student is looking at. 
- 3D VIRTUAL LAB INTERACTION: When the student opens the 3D lab, you will see the simulation. Comment on the 3D models, explain the physics/chemistry live, and guide them in their exploration.
- Spatial Awareness: You are an expert at coordinate mapping. The document uses a normalized 0-1000 coordinate system (0,0 is top-left, 1000,1000 is bottom-right). When you draw, ensure your coordinates are surgically precise on the target pixels.
  - Underlining: Y should be about 10-15 units below the text base.
  - Arrows: The end point MUST be exactly on the target feature.
  - Highlights: Center the highlight rectangle on the text.
- Feynman Check with a Twist: छात्र से कहो— "अब इसे मुझे ऐसे समझाओ जैसे मैं तुम्हारी 5 साल की चिढ़ाने वाली कज़िन हूँ। अगर मैं समझ गई, तो तुम पास हो।"
- No Spoons Feeding (Socratic Method): सीधे जवाब देने के बजाय, छात्र को सही दिशा में 'Push' करो। Ask probing questions to encourage critical thinking. उसे खुद सोचने और जवाब ढूँढने पर मजबूर करो।
- Sassy Feedback: सही जवाब पर— "Not bad! शायद तुम्हारे अंदर एक असली साइंटिस्ट छुपा है।" गलत जवाब पर— "उफ़! ये logic था या बस तुक्का? चलो, फिर से कोशिश करते हैं।"
- Interactive Tools: Use the provided tools (draw_*, toggle_whiteboard, etc.) to enhance your teaching. 
- WHITEBOARD PROTOCOL (CRITICAL):
  - STUDENT DRAWINGS: You must look at what the student draws or writes on the whiteboard. Discuss their work, point out mistakes, or appreciate their effort verbally.
  - VISION: Use your visual capabilities to see both the document and the student's whiteboard drawings.
  - OPENING/CLOSING: You can still use 'toggle_whiteboard' to ask the student to show you their board or go back to the document.
  - DOCUMENT DRAWING: Only draw on the document if you are in assignment checking mode or to explicitly point things out.

4. CONSTRAINTS:
- हमेशा Hinglish का इस्तेमाल करो।
- अगर इमेज खराब है, तो बोलो— "चश्मा पहनूँ या तुम साफ फोटो भेजोगे? ये धुंधलापन मेरी बर्दाश्त के बाहर है।"

Always respond as Nyra. Be vivid. Use your virtual laser pointer (tool calls) whenever you explain a visual part.
`;

export const drawHighlight: FunctionDeclaration = {
  name: "draw_highlight",
  parameters: {
    type: Type.OBJECT,
    description: "Draw a semi-transparent highlight on the document. Coordinates are normalized 0-1000.",
    properties: {
      x: { type: Type.NUMBER, description: "Left coordinate (0-1000)" },
      y: { type: Type.NUMBER, description: "Top coordinate (0-1000)" },
      width: { type: Type.NUMBER, description: "Width (0-1000)" },
      height: { type: Type.NUMBER, description: "Height (0-1000)" },
      color: { type: Type.STRING, description: "Color of highlight (e.g., 'yellow', 'pink', 'cyan')" },
    },
    required: ["x", "y", "width", "height"],
  },
};

export const drawPen: FunctionDeclaration = {
  name: "draw_pen",
  parameters: {
    type: Type.OBJECT,
    description: "Draw freehand lines, circles, or tick marks. Points are sequences of normalized (0-1000) [x, y] coordinates.",
    properties: {
      points: {
        type: Type.ARRAY,
        description: "List of [x, y] points (e.g., [[100, 100], [150, 200]])",
        items: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER }
        }
      },
      color: { type: Type.STRING, description: "Stroke color" },
    },
    required: ["points"],
  },
};

export const drawArrow: FunctionDeclaration = {
  name: "draw_arrow",
  parameters: {
    type: Type.OBJECT,
    description: "Draw an arrow from a start point to an end point.",
    properties: {
      startX: { type: Type.NUMBER, description: "Normalized start X" },
      startY: { type: Type.NUMBER, description: "Normalized start Y" },
      endX: { type: Type.NUMBER, description: "Normalized end X" },
      endY: { type: Type.NUMBER, description: "Normalized end Y" },
      color: { type: Type.STRING, description: "Arrow color" },
    },
    required: ["startX", "startY", "endX", "endY"],
  },
};

export const drawShape: FunctionDeclaration = {
  name: "draw_shape",
  parameters: {
    type: Type.OBJECT,
    description: "Draw geometric shapes like rectangles or circles.",
    properties: {
      type: { type: Type.STRING, description: "Shape type: 'rect' or 'circle'" },
      x: { type: Type.NUMBER, description: "Left/Root X" },
      y: { type: Type.NUMBER, description: "Top/Root Y" },
      width: { type: Type.NUMBER, description: "Width" },
      height: { type: Type.NUMBER, description: "Height" },
      color: { type: Type.STRING, description: "Color" },
    },
    required: ["type", "x", "y", "width", "height"],
  },
};

export const drawBracket: FunctionDeclaration = {
  name: "draw_bracket",
  parameters: {
    type: Type.OBJECT,
    description: "Draw a bracket ( { or [ ) to group multiple lines of text.",
    properties: {
      x: { type: Type.NUMBER, description: "X coordinate" },
      y: { type: Type.NUMBER, description: "Top coordinate" },
      height: { type: Type.NUMBER, description: "Height of the bracket" },
      side: { type: Type.STRING, description: "Which side: 'left' or 'right'" },
      color: { type: Type.STRING, description: "Color" },
    },
    required: ["x", "y", "height", "side"],
  },
};

export const drawTick: FunctionDeclaration = {
  name: "draw_tick",
  parameters: {
    type: Type.OBJECT,
    description: "Draw a tick mark (check mark) to indicate a correct answer.",
    properties: {
      x: { type: Type.NUMBER, description: "Normalized X" },
      y: { type: Type.NUMBER, description: "Normalized Y" },
      color: { type: Type.STRING, description: "Color" },
    },
    required: ["x", "y"],
  },
};

export const drawText: FunctionDeclaration = {
  name: "draw_text",
  parameters: {
    type: Type.OBJECT,
    description: "Write text or digits on the document. Useful for adding notes, solving equations, or labeling parts.",
    properties: {
      x: { type: Type.NUMBER, description: "Normalized X coordinate (0-1000)" },
      y: { type: Type.NUMBER, description: "Normalized Y coordinate (0-1000)" },
      text: { type: Type.STRING, description: "The text/digits to write" },
      color: { type: Type.STRING, description: "Text color" },
      size: { type: Type.NUMBER, description: "Font size (10-50)" },
    },
    required: ["x", "y", "text"],
  },
};

export const toggleWhiteboard: FunctionDeclaration = {
  name: "toggle_whiteboard",
  parameters: {
    type: Type.OBJECT,
    description: "Open or close the virtual whiteboard (canvas).",
    properties: {
      open: { type: Type.BOOLEAN, description: "Whether to open (true) or close (false) the whiteboard." }
    },
    required: ["open"],
  },
};

export const postToChat: FunctionDeclaration = {
  name: "post_to_chat",
  parameters: {
    type: Type.OBJECT,
    description: "Post a structured note, formula, or summary to the student's Chat Box. Use this for important information that should stay in the notes history.",
    properties: {
      text: { type: Type.STRING, description: "The content to post (Markdown/LaTeX supported)" }
    },
    required: ["text"],
  },
};

export const open3DLab: FunctionDeclaration = {
  name: "open_3d_lab",
  parameters: {
    type: Type.OBJECT,
    description: "Open the 3D Virtual Lab for the student to visualize complex physics or chemistry models.",
    properties: {
      labType: { 
        type: Type.STRING, 
        description: "The type of simulation to load: 'atom', 'pendulum', 'solar', 'optics', 'electro', 'organic', 'heart', or 'math'",
        enum: ["atom", "pendulum", "solar", "optics", "electro", "organic", "heart", "math"]
      }
    },
    required: ["labType"],
  },
};

export const drawNeuralMap: FunctionDeclaration = {
  name: "draw_neural_map",
  parameters: {
    type: Type.OBJECT,
    description: "Overlay a 'Neural Map' of shortcut methods and tricks on the screen. This creates a visual cluster of connected concepts/formulas.",
    properties: {
      centerX: { type: Type.NUMBER, description: "Center X of the map (0-1000)" },
      centerY: { type: Type.NUMBER, description: "Center Y of the map (0-1000)" },
      title: { type: Type.STRING, description: "Main concept/trick name" },
      nodes: {
        type: Type.ARRAY,
        description: "Branching nodes/formulas for the trick",
        items: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            importance: { type: Type.NUMBER, description: "Scale 1-5" }
          }
        }
      }
    },
    required: ["centerX", "centerY", "title", "nodes"],
  },
};

export const generatePracticeProblem: FunctionDeclaration = {
  name: "generate_practice_problem",
  parameters: {
    type: Type.OBJECT,
    description: "Generate a unique numerical problem with randomized values on-the-fly for the student to solve.",
    properties: {
      topic: { type: Type.STRING, description: "Physics/Chemistry topic" },
      difficulty: { type: Type.STRING, description: "1-5 or 'Beginner' to 'Advanced'" },
      problemText: { type: Type.STRING, description: "The actual problem with LaTeX and generated values" }
    },
    required: ["topic", "problemText"],
  },
};

export const clearWhiteboard: FunctionDeclaration = {
  name: "clear_whiteboard",
  parameters: {
    type: Type.OBJECT,
    description: "Clear all drawings and text from the virtual whiteboard.",
    properties: {},
  },
};

export const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function chatWithNyra(
  message: string,
  imageContent: string | null, // base64
  cursorPos?: { x: number; y: number },
  history: any[] = []
) {
  const parts: any[] = [{ text: message }];
  
  if (imageContent) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageContent.split(',')[1]
      }
    });
  }

  if (cursorPos) {
    parts.push({ text: `[SYSTEM] User is currently pointing at normalized coordinates: x:${Math.round(cursorPos.x)}, y:${Math.round(cursorPos.y)} (0-1000 scale)` });
  }

  // To prevent consecutive user roles which causes API error
  const filteredHistory = history.filter((msg, idx) => {
    // If it's the last message in history and it matches our current message, 
    // it's likely the same one just saved to DB. Filter it out to avoid duplication.
    if (idx === history.length - 1 && msg.role === 'user' && msg.parts[0].text === message) {
      return false;
    }
    return true;
  });

  const response = await genAI.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [...filteredHistory, { role: "user", parts }],
    config: {
      systemInstruction: NYRA_SYSTEM_INSTRUCTION,
      tools: [{ 
        functionDeclarations: [
          toggleWhiteboard, open3DLab, postToChat, clearWhiteboard, 
          drawNeuralMap, generatePracticeProblem,
          drawHighlight, drawPen, drawArrow, drawShape, drawBracket, drawTick, drawText
        ] 
      }]
    }
  });

  return response;
}
