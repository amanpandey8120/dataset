import pandas as pd
import google.generativeai as genai
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import textwrap
import subprocess
import sys

# Try Gemini first, fallback to Ollama if it fails
USE_GEMINI = True  # Set to False to use Ollama directly

if USE_GEMINI:
    # Set your Gemini API key here
    GEMINI_API_KEY = "AIzaSyARB035xgbXcdSii57hqKxnWks9IGWvzCQ"  # Replace with your key
    genai.configure(api_key=GEMINI_API_KEY)

EXCEL_PATH = "supermarkt_sales.xlsx"
TOP_K = 10000
MAX_CONTEXT_CHARS = 10000

# ---------------------- Check Ollama Installation ----------------------
def check_ollama():
    """Check if Ollama is installed and model is available"""
    try:
        result = subprocess.run(["ollama", "list"], capture_output=True, text=True)
        if result.returncode == 0:
            if "llama3.2:1b" not in result.stdout:
                print("⚠️  Downloading llama3.2:1b model...")
                subprocess.run(["ollama", "pull", "llama3.2:1b"], check=True)
            return True
        return False
    except:
        return False

# ---------------------- List Available Gemini Models ----------------------
def list_gemini_models():
    """List available Gemini models"""
    try:
        print("\n🔍 Available Gemini Models:")
        models = genai.list_models()
        available_models = []
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                print(f"  ✅ {model.name}")
                available_models.append(model.name)
        return available_models
    except Exception as e:
        print(f"❌ Cannot list Gemini models: {e}")
        return []

# ---------------------- Get Working Gemini Model ----------------------
def get_gemini_model():
    """Try different Gemini model names until one works"""
    # Try these models in order
    model_names = [
        "gemini-1.5-flash-latest",  # Fastest, free tier
        "gemini-1.5-pro-latest",    # More capable
        "gemini-1.0-pro-latest",    # Older but works
        "gemini-pro",               # Original name
    ]
    
    for model_name in model_names:
        try:
            model = genai.GenerativeModel(model_name)
            # Quick test
            response = model.generate_content("Say 'Connected'")
            print(f"✅ Using model: {model_name}")
            return model
        except Exception as e:
            print(f"❌ {model_name}: {str(e)[:100]}...")
            continue
    
    print("❌ No Gemini models worked. Switching to Ollama...")
    return None

# ---------------------- Read WHOLE Excel ----------------------
def load_excel(path):
    try:
        sheets = pd.read_excel(path, sheet_name=None)
        print(f"Found {len(sheets)} sheets in the Excel file")
        
    except Exception as e:
        print(f"Could not read all sheets: {e}")
        print("Trying to read the first sheet...")
        df = pd.read_excel(path)
        sheets = {"Sales": df}
    
    all_data = []
    
    for sheet_name, df in sheets.items():
        print(f"  Sheet: '{sheet_name}' - {len(df)} rows, {len(df.columns)} columns")
        df = df.fillna("")
        df.columns = df.columns.astype(str)
        df['_sheet_name'] = sheet_name
        
        for idx, row in df.iterrows():
            if row.astype(str).str.strip().eq('').all():
                continue
            row_dict = row.to_dict()
            all_data.append({
                'sheet': sheet_name,
                'row_idx': idx,
                'data': row_dict
            })
    
    print(f"\n✔ Loaded {len(all_data)} total rows from Excel")
    return all_data, list(sheets.keys())

# ---------------------- Convert rows to text chunks ----------------------
def create_chunks(all_data):
    chunks = []
    metadata = []
    
    for item in all_data:
        sheet = item['sheet']
        row_idx = item['row_idx']
        row_data = item['data']
        
        parts = []
        for key, value in row_data.items():
            if key != '_sheet_name':
                clean_key = str(key).replace('\n', ' ').strip()
                clean_value = str(value).replace('\n', ' ').strip()
                parts.append(f"{clean_key}: {clean_value}")
        
        text = f"[Sheet: {sheet}, Row: {row_idx}] | " + " | ".join(parts)
        chunks.append(text)
        
        metadata.append({
            'sheet': sheet,
            'row_idx': row_idx,
            'full_data': row_data
        })
    
    return chunks, metadata

# ---------------------- Build TF-IDF Index ----------------------
def build_index(chunks):
    vectorizer = TfidfVectorizer(
        stop_words=None,
        ngram_range=(1, 2),
        max_features=None,
        min_df=1,
        max_df=1.0
    )
    X = vectorizer.fit_transform(chunks)
    print(f"TF-IDF matrix shape: {X.shape}")
    return vectorizer, X

# ---------------------- Retrieve Relevant Chunks ----------------------
def retrieve(query, vectorizer, X, chunks, metadata, top_k=TOP_K):
    q_vec = vectorizer.transform([query])
    sims = cosine_similarity(q_vec, X)[0]
    
    ranked_idx = sims.argsort()[::-1][:top_k]
    
    results = []
    for i in ranked_idx:
        if sims[i] > 0.01:
            results.append({
                'score': float(sims[i]),
                'index': int(i),
                'chunk': chunks[i],
                'sheet': metadata[i]['sheet'],
                'row_idx': metadata[i]['row_idx'],
                'data': metadata[i]['full_data']
            })
    
    return results

# ---------------------- Ask AI (Gemini or Ollama) ----------------------
def ask_ai(context, question, gemini_model=None):
    if len(context) > MAX_CONTEXT_CHARS:
        context = context[:MAX_CONTEXT_CHARS] + "\n\n[TRUNCATED]"

    prompt = f"""You are an Excel data analyst. Answer the question using ONLY the Excel data provided below.

Excel Data:
{context}

Question: {question}

Instructions:
1. Analyze the Excel data carefully
2. Answer based ONLY on the data provided
3. If performing calculations, show your reasoning
4. If the answer is not found in the data, say: "Data not found in the provided Excel rows."
5. Be precise and factual
6. Format your answer clearly with bullet points when appropriate
"""

    # Try Gemini first
    if gemini_model:
        try:
            response = gemini_model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"⚠️  Gemini failed, trying Ollama: {str(e)[:100]}...")
    
    # Fallback to Ollama
    try:
        import ollama
        messages = [
            {"role": "system", "content": "You are an Excel data analyst."},
            {"role": "user", "content": prompt}
        ]
        resp = ollama.chat(model="llama3.2:1b", messages=messages)
        return resp["message"]["content"]
    except Exception as e:
        return f"Error calling AI: {str(e)}"

# ---------------------- Display Results ----------------------
def display_results(results, max_display=5):
    print(f"\nFound {len(results)} relevant rows:")
    for i, result in enumerate(results[:max_display]):
        print(f"\n{i+1}. Score: {result['score']:.4f}")
        print(f"   Sheet: {result['sheet']}, Row: {result['row_idx']+1}")
        print(f"   Data preview: {textwrap.shorten(result['chunk'], width=120)}")

# ---------------------- Enhanced Display Function for Excel Data ----------------------
def display_excel_data(row_data):
    print("\n" + "="*80)
    print(f"EXCEL ROW DATA (Sheet: {row_data.get('_sheet_name', 'Unknown')}):")
    print("="*80)
    
    for key, value in row_data.items():
        if key != '_sheet_name':
            print(f"{key:25}: {str(value)[:80]}")
    
    print("="*80)

# ---------------------- Main Program ----------------------
def main():
    print("="*80)
    print("EXCEL DATA ANALYZER")
    print("="*80)
    
    gemini_model = None
    ai_type = "Ollama (Local)"
    
    # Try to use Gemini if configured
    if USE_GEMINI and GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
        try:
            print("\n🔍 Testing Gemini API...")
            list_gemini_models()
            gemini_model = get_gemini_model()
            if gemini_model:
                ai_type = "Gemini (Cloud)"
                print(f"✅ Using {ai_type}")
            else:
                print("⚠️  Gemini not available, using Ollama")
        except Exception as e:
            print(f"⚠️  Gemini failed: {e}")
            print("Switching to Ollama...")
    else:
        print("\n⚠️  Gemini API key not set or disabled.")
        print("Using Ollama (local AI) instead.")
    
    # Check Ollama
    if not gemini_model:
        print("\n🔍 Checking Ollama installation...")
        if check_ollama():
            print("✅ Ollama is ready!")
        else:
            print("❌ Ollama is not installed or not running.")
            print("\nTo install Ollama:")
            print("1. Download from: https://ollama.com/download")
            print("2. Run the installer")
            print("3. Open Command Prompt and run: ollama pull llama3.2:1b")
            print("4. Run this script again")
            return
    
    print("\nLoading Excel file...")
    all_data, sheet_names = load_excel(EXCEL_PATH)
    
    print("\nCreating text chunks from Excel data...")
    chunks, metadata = create_chunks(all_data)
    print(f"Created {len(chunks)} text chunks")
    
    print("\nBuilding TF-IDF search index...")
    vectorizer, X = build_index(chunks)
    print(f"Vocabulary size: {len(vectorizer.get_feature_names_out())} terms")
    
    print("\n" + "="*80)
    print(f"Excel Data Loaded Successfully!")
    print(f"AI Engine: {ai_type}")
    print(f"Total Sheets: {len(sheet_names)}")
    print(f"Total Rows: {len(all_data)}")
    print("You can now query your Excel data!")
    print("="*80)
    
    print("\n📋 Sample questions you can ask:")
    print("1. 'Show me all sales in Yangon'")
    print("2. 'What is the total sales amount?'")
    print("3. 'Find sales with rating above 9'")
    print("4. 'Show me Electronic accessories sales'")
    print("5. 'Find the highest gross income transaction'")
    print("\nType 'exit' to quit, 'show all' to see all data, or 'sheet [name]' to see specific sheet")
    print("="*80 + "\n")

    while True:
        query = input("\nQ: ").strip()
        
        if query.lower() == 'exit':
            print("Goodbye!")
            break
        
        if not query:
            continue
        
        # Special commands
        if query.lower() == 'show all':
            print(f"\nShowing all {len(all_data)} rows:")
            for i, item in enumerate(all_data[:20]):
                print(f"\n{i+1}. Sheet: {item['sheet']}, Row {item['row_idx']+1}")
                display_excel_data(item['data'])
                if i >= 19:
                    print(f"\n... and {len(all_data) - 20} more rows")
                    break
            continue
        
        if query.lower().startswith('sheet '):
            sheet_name = query[6:].strip()
            print(f"\nLooking for sheet: '{sheet_name}'")
            sheet_data = [item for item in all_data if item['sheet'].lower() == sheet_name.lower()]
            if sheet_data:
                print(f"Found {len(sheet_data)} rows in sheet '{sheet_name}':")
                for i, item in enumerate(sheet_data[:10]):
                    print(f"\n{i+1}. Row {item['row_idx']+1}")
                    display_excel_data(item['data'])
                    if i >= 9:
                        print(f"\n... and {len(sheet_data) - 10} more rows in this sheet")
                        break
            else:
                print(f"No sheet named '{sheet_name}' found. Available sheets: {', '.join(sheet_names)}")
            continue
        
        if query.lower() == 'help':
            print("\nAvailable commands:")
            print("  'exit' - Quit the program")
            print("  'show all' - Display all Excel data")
            print("  'sheet [name]' - Show data from specific sheet")
            print("  'help' - Show this help message")
            print("\nYou can also ask natural language questions about your data")
            continue
        
        print(f"\n🔍 Searching for: '{query}'")
        
        # Retrieve relevant chunks
        retrieved = retrieve(query, vectorizer, X, chunks, metadata, top_k=50)
        
        if retrieved:
            display_results(retrieved)
            
            # Prepare context
            context_parts = []
            for result in retrieved[:10]:
                context_parts.append(f"Sheet: {result['sheet']}, Row {result['row_idx']+1}: {result['chunk']}")
            
            context = "\n\n".join(context_parts)
            
            print(f"\n{'='*80}")
            print(f"🤖 Generating answer with {ai_type}...")
            answer = ask_ai(context, query, gemini_model)
            print(f"\n📊 Answer:\n{answer}")
            
            # Show detailed data from top result
            if retrieved:
                print(f"\n{'='*80}")
                print("📋 DETAILED VIEW OF TOP RESULT:")
                display_excel_data(retrieved[0]['data'])
        else:
            print("❌ No relevant data found for your query.")
            
            if all_data and all_data[0]['data']:
                sample_row = all_data[0]['data']
                columns = [col for col in sample_row.keys() if col != '_sheet_name']
                print(f"\n💡 Available columns in your data: {', '.join(columns[:15])}")
                if len(columns) > 15:
                    print(f"   ... and {len(columns) - 15} more columns")
        
        print("\n" + "-"*80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nProgram interrupted. Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        print("\nQuick fix options:")
        print("1. Use Ollama (local, free):")
        print("   - Change line 10 to: USE_GEMINI = False")
        print("   - Install: pip install ollama")
        print("   - Download Ollama from: https://ollama.com/download")
        print("   - Run: ollama pull llama3.2:1b")
        print("\n2. Use Gemini (cloud, needs API key):")
        print("   - Get API key: https://makersuite.google.com/app/apikey")
        print("   - Paste in line 13")
