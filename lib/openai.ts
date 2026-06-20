import { Agent, run } from '@openai/agents';
import { z } from 'zod';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not defined. Using high-fidelity local Agent simulations.');
}

// ==========================================
// 1. Zod Structuring Schemas
// ==========================================

export const TranslationSchema = z.object({
  en: z.string(),
  ur: z.string(),
  sd: z.string()
});

export const FinderResponseSchema = z.object({
  action: z.enum(['search', 'info']),
  targetRoute: z.string().optional(),
  responseText: z.object({
    en: z.string(),
    ur: z.string(),
    sd: z.string()
  })
});

export const ProductQueryResponseSchema = z.object({
  text: z.string()
});

// ==========================================
// 2. OpenAI Agents Definitions
// ==========================================

export const translatorAgent = new Agent({
  name: 'Translator',
  instructions: `You are an expert translator specializing in Pakistani languages. 
  Detect the language of the user input (English, Urdu, Sindhi, or Roman Urdu/Sindhi like "Lal Rilli" or "Ghar ki Biryani"). 
  Translate the input text and return a JSON object with exactly three keys:
  - "en": Translation in English
  - "ur": Translation in standard Urdu script (Arabic script)
  - "sd": Translation in standard Sindhi script (Arabic script)`,
  outputType: TranslationSchema
});

export const finderAgent = new Agent({
  name: 'AIFinder',
  instructions: `You are an AI Agent for HunarAangan, an e-commerce marketplace for Pakistani female artisans. 
  Determine if the user is searching for a product category (rilli/patchwork, ajrak, food/biryani, embroidery, handicrafts) or asking a general policy question (payments, delivery, shipping times, EasyPaisa, Cash on Delivery, JazzCash).
  
  Rules:
  1. If it is a search for a category, set action to "search" and targetRoute to:
     - "/categories/rilli" for rilli, patchwork, or quilt.
     - "/categories/ajrak" for ajrak or block prints.
     - "/categories/food" for food, biryani, or meals.
     - "/categories/embroidery" for embroidery, handwork, or kurti.
     - "/categories/handicrafts" for other handicrafts, pots, bags.
  2. If it is a policy/help question, set action to "info".
  
  Always return responseText populated with friendly responses in English ("en"), Urdu script ("ur"), and Sindhi script ("sd").`,
  outputType: FinderResponseSchema
});

export const productExplainerAgent = new Agent({
  name: 'ProductExplainer',
  instructions: `You are an AI Agent explaining product specifications to buyers. 
  Answer questions about the product based on its title, price, delivery time, and custom service status.
  Answer in the requested language (English, Urdu, or Sindhi). Keep the response friendly, clear, and reassuring.`,
  outputType: ProductQueryResponseSchema
});

export const listingDraftAgent = new Agent({
  name: 'ListingDraftExtractor',
  instructions: `You are an AI assistant that extracts product listing details from user-provided text drafts or voice transcripts.
  Extract the following structured details:
  1. Title: The name of the product. Keep it close to what the user provided, do not make it generic. Translate it accurately to English ("en"), Urdu script ("ur"), and Sindhi script ("sd").
  2. Description: A description of the product. If the user provided one, use it and translate/expand it slightly to be professional. If not, write a standard professional description based on the title. Translate it to English ("en"), Urdu ("ur"), and Sindhi ("sd").
  3. Price: The price/amount specified by the user. If they specified a number, extract it as an integer. Defaults to 1500 if not found.
  4. Category: Classify into one of: 'Rilli', 'Ajrak', 'Food', 'Embroidery', 'Handicrafts'. If it fits another custom category specified by the user, use that.
  5. Image: Extract any image URL or file path (e.g. starting with http://, https://, or ending with image extensions like .jpg, .png) mentioned in the text. If none is found, return "".

  Do not invent details that contradict the user input. Preserve specific names, colors, patterns, and materials provided by the user.`,
  outputType: z.object({
    title: TranslationSchema,
    description: TranslationSchema,
    price: z.number(),
    category: z.string(),
    image: z.string()
  })
});

// ==========================================
// 3. Exposed Service Functions
// ==========================================

/**
 * Speech-to-Text via Whisper (Dummy stub for backward compatibility since mic is removed)
 */
export async function transcribeAudio(audioBuffer: Buffer, language?: string): Promise<string> {
  return "Query simulated from voice.";
}

/**
 * Voice-to-Store agent parser / typed text summary parser.
 * Dynamically extracts title, price, category, and delivery time.
 */
export async function parseVoiceListing(transcript: string): Promise<{
  title: { en: string; ur: string; sd: string };
  description: { en: string; ur: string; sd: string };
  price: number;
  category: string;
  image: string;
}> {
  if (apiKey) {
    try {
      const result = await run(listingDraftAgent, transcript);
      if (result.finalOutput) {
        return result.finalOutput;
      }
    } catch (e) {
      console.error('Agents SDK parseVoiceListing failed, using fallback:', e);
    }
  }

  const text = transcript.toLowerCase();
  
  // Extract Image URL if present in transcript
  let imageUrl = '';
  const urlMatch = transcript.match(/\b(https?:\/\/\S+)\b/i) || transcript.match(/\b(\S+\.(?:png|jpg|jpeg|gif))\b/i);
  if (urlMatch) {
    imageUrl = urlMatch[1];
  }

  // Remove the image URL or filename from the transcript for cleaner parsing of text details
  let cleanText = transcript;
  if (urlMatch) {
    cleanText = cleanText.replace(urlMatch[0], '');
  }

  // 1. Extract Price
  let price = 1500; // default fallback
  const priceMatch = cleanText.match(/\b(?:rs\.?|rupees|pkr)?\s*(\d{3,6})\b/i) || cleanText.match(/\b(\d{3,6})\s*(?:rs\.?|rupees|pkr)?\b/i);
  if (priceMatch && priceMatch[1]) {
    price = parseInt(priceMatch[1], 10);
  }

  // 2. Match Category
  let category = 'Handicrafts';
  if (text.includes('rilli') || text.includes('quilt') || text.includes('patchwork') || text.includes('رلی')) {
    category = 'Rilli';
  } else if (text.includes('ajrak') || text.includes('اجرک')) {
    category = 'Ajrak';
  } else if (text.includes('food') || text.includes('biryani') || text.includes('meal') || text.includes('بریانی') || text.includes('کھانا')) {
    category = 'Food';
  } else if (text.includes('embroidery') || text.includes('shawl') || text.includes('kurti') || text.includes('kadhai') || text.includes('کڑھائی')) {
    category = 'Embroidery';
  } else if (text.includes('pot') || text.includes('mitti') || text.includes('handicraft') || text.includes('دستکاری')) {
    category = 'Handicrafts';
  }

  // 3. Extract Clean Title (remove price patterns)
  let cleanTitle = cleanText
    .replace(/\b(?:rs\.?|rupees|pkr)?\s*\d{3,6}\b/gi, '')
    .replace(/\bimage|url|photo|link\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  cleanTitle = cleanTitle.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '').trim();

  if (cleanTitle.length < 3) {
    cleanTitle = 'Handcrafted Custom Item';
  } else {
    // Capitalize words
    cleanTitle = cleanTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // Translate details (using our trilingual helper that doesn't override titles)
  const translatedTitle = await translateText(cleanTitle);
  const translatedDesc = {
    en: `This beautiful product is "${cleanTitle}" handcrafted by our verified artisan. Price is Rs. ${price}.`,
    ur: `یہ خوبصورت پروڈکٹ "${translatedTitle.ur}" ہے، جو ہمارے تصدیق شدہ کاریگر نے تیار کی ہے۔ قیمت ${price} روپے ہے۔`,
    sd: `هي خوبصورت پراڊڪٽ "${translatedTitle.sd}" آهي، جيڪا اسان جي تصديق ٿيل ڪاريگر تيار ڪئي آهي. قيمت ${price} رپيا آهي.`
  };

  return {
    title: translatedTitle,
    description: translatedDesc,
    price,
    category,
    image: imageUrl
  };
}

/**
 * Trilingual translator using Agents SDK.
 */
export async function translateText(text: string): Promise<{ en: string; ur: string; sd: string }> {
  if (apiKey) {
    try {
      const result = await run(translatorAgent, text);
      if (result.finalOutput) {
        return result.finalOutput;
      }
    } catch (e) {
      console.error('Agents SDK translation failed, using fallback:', e);
    }
  }

  // Fallback Translator: keep original text but replace common keywords for Urdu/Sindhi if matched, without losing user details!
  const query = text.toLowerCase();
  let urText = text;
  let sdText = text;

  // Let's do simple keyword translations to show localization capability
  if (query.includes('rilli')) {
    urText = text.replace(/rilli/gi, 'رلی');
    sdText = text.replace(/rilli/gi, 'رلي');
  } else if (query.includes('ajrak')) {
    urText = text.replace(/ajrak/gi, 'اجرک');
    sdText = text.replace(/ajrak/gi, 'اجرڪ');
  } else if (query.includes('biryani')) {
    urText = text.replace(/biryani/gi, 'بریانی');
    sdText = text.replace(/biryani/gi, 'برياڻي');
  } else if (query.includes('shawl')) {
    urText = text.replace(/shawl/gi, 'شال');
    sdText = text.replace(/shawl/gi, 'شال');
  }

  return {
    en: text,
    ur: urText,
    sd: sdText
  };
}

/**
 * Floating AI Finder & Help Answerer.
 * Matches user query using Agents SDK and yields routes or answers.
 */
export async function queryAIFinder(query: string, language: 'en' | 'ur' | 'sd'): Promise<{
  action: 'search' | 'info';
  targetRoute?: string;
  responseText: { en: string; ur: string; sd: string };
}> {
  if (apiKey) {
    try {
      const result = await run(finderAgent, `User language preference: ${language}. Query: "${query}"`);
      if (result.finalOutput) {
        return result.finalOutput;
      }
    } catch (e) {
      console.error('Agents SDK finder failed, using fallback:', e);
    }
  }

  // Fallback simulator matching the schema rules
  const text = query.toLowerCase();
  const paymentQueries = ['pay', 'paisa', 'card', 'credit', 'jazzcash', 'easypaisa', 'cash', 'deliver', 'delivery', 'waqt', 'din', 'how to', 'kese', 'tarika', 'delivery kitne', 'delivery check'];
  const deliveryQueries = ['deliver', 'delivery', 'din', 'time', 'shipping', 'bhej', 'shipp', 'pohanch'];

  let action: 'search' | 'info' = 'search';
  let targetRoute = '/';
  let responseText = {
    en: "Here are the items related to your search.",
    ur: "یہاں آپ کی تلاش سے متعلقہ مصنوعات ہیں۔",
    sd: "هتي توهان جي ڳولا سان لاڳاپيل شيون آهن۔"
  };

  const hasPaymentQuery = paymentQueries.some(q => text.includes(q));
  const hasDeliveryQuery = deliveryQueries.some(q => text.includes(q));

  if (hasPaymentQuery && !text.includes('ajrak') && !text.includes('rilli') && !text.includes('biryani')) {
    action = 'info';
    responseText = {
      en: "HunarAangan supports easy payment options. You can pay via EasyPaisa, JazzCash, Cash on Delivery (COD), or Credit/Debit Card. Escrow keeps your funds safe until delivery.",
      ur: "ہنر آنگن پر آپ ایزی پیسہ، جاز کیش، کیش آن ڈیلیوری (COD) یا کارڈ کے ذریعے ادائیگی کر سکتے ہیں۔ رقم ہینڈ اوور ہونے تک ایسکرو میں محفوظ رہتی ہے۔",
      sd: "هنر آنگن تي توهان ايزي پيسا، جاز ڪيش، ڪيش آن ڊليوري (COD) يا ڪارڊ ذريعي ادائيگي ڪري سگهو ٿا. رقم ڊليوري تائين ايسكرو ۾ محفوظ رهندي."
    };
  } else if (hasDeliveryQuery && !text.includes('ajrak') && !text.includes('rilli') && !text.includes('biryani')) {
    action = 'info';
    responseText = {
      en: "Standard delivery takes 3 to 5 working days. Handmade customized products can take longer depending on the artisan's embroidery schedule.",
      ur: "معیاری ڈیلیوری میں 3 سے 5 دن لگتے ہیں۔ ہاتھ سے بنے ہوئے خصوصی آرڈرز میں کاریگر کی کڑھائی کے شیڈول کے مطابق زیادہ وقت لگ سکتا ہے۔",
      sd: "معياري ڊليوري ۾ 3 کان 5 ڏينهن لڳندا آهن. هٿ سان ٺهيل خاص آرڊرن ۾ ڪاريگر جي ڪڙهائي جي شيڊول موجب وڌيڪ وقت لڳي سگهي ٿو."
    };
  } else {
    // Search query redirects
    if (text.includes('ajrak') || text.includes('اجرک')) {
      targetRoute = '/categories/ajrak';
      responseText = {
        en: "Routing you to our beautiful hand-block printed Ajrak inventory.",
        ur: "ہم آپ کو ہمارے شاندار ہینڈ بلاک پرنٹ شدہ اجرک کلیکشن پر لے جا رہے ہیں۔",
        sd: "اسان توهان کي اسان جي شاندار بلاڪ پرنٽ ٿيل اجرڪ جي ڪليڪشن تي وٺي وڃون ٿا."
      };
    } else if (text.includes('rilli') || text.includes('رلی') || text.includes('patchwork')) {
      targetRoute = '/categories/rilli';
      responseText = {
        en: "Showing standard and customized Rilli patchwork designs.",
        ur: "ہم آپ کو روایتی اور ہاتھ سے بنی رلیوں کا مجموعہ دکھا رہے ہیں۔",
        sd: "توهان کي روايتي ۽ هٿ سان ٺهيل رلين جي ڪليڪشن ڏيکاري رهيا آهيون."
      };
    } else if (text.includes('biryani') || text.includes('food') || text.includes('khana') || text.includes('روٹی')) {
      targetRoute = '/categories/food';
      responseText = {
        en: "Showing delicious home-cooked meals and local specialities.",
        ur: "ہم آپ کو گھر کے بنے لذیذ خانوں اور مقامی پکوانوں پر لے جا رہے ہیں۔",
        sd: "اسان توهان کي گهر جي ٺهيل لذيذ کاڌن ۽ مقامي شين تي وٺي وڃون ٿا."
      };
    } else if (text.includes('embroidery') || text.includes('hath ka kaam') || text.includes('kadhai') || text.includes('کڑھائی')) {
      targetRoute = '/categories/embroidery';
      responseText = {
        en: "Showing hand-embroidered apparel and artisanal work.",
        ur: "ہاتھ کی کڑھائی اور دستکاری کے لباس کی نمائش کی جا رہی ہے۔",
        sd: "هٿ جي ڪڙهائي ۽ دستڪاري جي ڪپڙن جي نمائش ڪئي پئي وڃي."
      };
    }
  }

  return {
    action,
    targetRoute,
    responseText
  };
}

/**
 * Ask AI - Product Specific explainer widget answer.
 */
export async function answerProductQuery(
  productContext: { title: string; price: number; deliveryTime: number; isCustomService: boolean },
  question: string,
  lang: 'en' | 'ur' | 'sd'
): Promise<{ text: string }> {
  if (apiKey) {
    try {
      const result = await run(productExplainerAgent, `Product: ${JSON.stringify(productContext)}. Question: "${question}". Answer in language: "${lang}"`);
      if (result.finalOutput) {
        return { text: result.finalOutput.text };
      }
    } catch (e) {
      console.error('Agents SDK product explainer failed, using fallback:', e);
    }
  }

  // Fallback simulator
  const text = question.toLowerCase();
  let response = '';

  if (lang === 'ur') {
    if (text.includes('shrink') || text.includes('سکڑ') || text.includes('رنگ')) {
      response = `یہ ${productContext.title} اعلی معیار کے پکے سوتی دھاگے سے بنی ہے۔ یہ بالکل نہیں سکڑے گی اور نہ ہی اس کا رنگ خراب ہو گا۔`;
    } else if (text.includes('delivery') || text.includes('jaldi') || text.includes('din') || text.includes('2 day') || text.includes('jaldi mil')) {
      response = `یہ مصنوعات عام طور پر ${productContext.deliveryTime} دن میں پہنچتی ہے۔ چیٹ کے ذریعے کسٹم آرڈر کے لیے کاریگر سے بات کر کے جلدی منگوا سکتی ہیں۔`;
    } else if (text.includes('oil') || text.includes('تیل') || text.includes('گھی')) {
      response = `جی بالکل، ہماری شیف یہ کھانا کم تیل اور مسالوں کے ساتھ آپ کی پسند کے مطابق تیار کر سکتی ہیں۔`;
    } else {
      response = `یہ ${productContext.title} ہاتھ کا خالص کام ہے۔ اس کی قیمت ${productContext.price} روپے ہے۔ یہ بہت پائیدار اور خوبصورت ہے۔`;
    }
  } else if (lang === 'sd') {
    if (text.includes('shrink') || text.includes('سڪڙ') || text.includes('رنگ')) {
      response = `هيءَ ${productContext.title} اعليٰ معيار جي پڪي سوتي ڌاڳي مان ٺهيل آهي. هي بلڪل نه سڪڙندي ۽ نه ئي ان جو رنگ خراب ٿيندو.`;
    } else if (text.includes('delivery') || text.includes('جلدي') || text.includes('ڏينهن') || text.includes('2 day')) {
      response = `هيءَ شيءِ عام طور تي ${productContext.deliveryTime} ڏينهن ۾ پهچندي آهي. جلدی آرڈر کے لیے کاریگر سے چیٹ پر بات کریں۔`;
    } else if (text.includes('oil') || text.includes('تیل') || text.includes('گھي')) {
      response = `جي ها، اسان جي شيف هي کاڌو گهٽ تيل ۽ گهٽ مصالحن سان خاص توهان جي پسند مطابق تيار ڪري سگهي ٿي.`;
    } else {
      response = `هيءَ ${productContext.title} هٿ جو خالص ڪم آهي. ان جي قيمت ${productContext.price} رپيا آهي. هيءَ تمام پائيدار ۽ خوبصورت آهي.`;
    }
  } else {
    // English Default
    if (text.includes('shrink') || text.includes('color') || text.includes('fade')) {
      response = `This ${productContext.title} is made from pre-washed premium threads. It will not shrink or lose color.`;
    } else if (text.includes('delivery') || text.includes('fast') || text.includes('days') || text.includes('2 day')) {
      response = `Standard delivery takes ${productContext.deliveryTime} days. For faster shipping, contact the artisan in chat.`;
    } else if (text.includes('oil') || text.includes('healthy') || text.includes('spice')) {
      response = `Yes, our home chef can cook this meal with less oil and customized spice levels based on your preferences.`;
    } else {
      response = `This ${productContext.title} is handcrafted by our verified artisan. It costs Rs. ${productContext.price} and delivers in ${productContext.deliveryTime} days.`;
    }
  }

  return {
    text: response
  };
}
