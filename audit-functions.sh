#!/bin/bash

echo "🔍 FUNCTION USAGE AUDIT"
echo "====================="
echo ""

# Function to check if a function is used in a component
check_function_usage() {
    local component_file=$1
    local logic_file=$2
    local component_name=$3
    
    echo "📋 Checking $component_name"
    echo "------------------------"
    
    # Get all exported functions from the logic file
    exported_functions=$(grep "^export function" "$logic_file" | sed 's/export function \([^(]*\).*/\1/')
    
    # Count total functions
    total_functions=$(echo "$exported_functions" | wc -l)
    used_count=0
    unused_functions=()
    
    # Check each function
    while IFS= read -r func_name; do
        if grep -q "$func_name" "$component_file"; then
            echo "✅ $func_name - USED"
            ((used_count++))
        else
            echo "❌ $func_name - UNUSED"
            unused_functions+=("$func_name")
        fi
    done <<< "$exported_functions"
    
    echo ""
    echo "Summary: $used_count/$total_functions functions used"
    
    if [ ${#unused_functions[@]} -gt 0 ]; then
        echo "🗑️  Unused functions to remove:"
        for func in "${unused_functions[@]}"; do
            echo "   - $func"
        done
    fi
    echo ""
}

# Check CardFront
check_function_usage "src/lib/components/cards/CardFront.svelte" "src/lib/components/cards/CardFront.svelte.ts" "CardFront"

# Check DeckManager  
check_function_usage "src/lib/components/deck/DeckManager.svelte" "src/lib/components/deck/DeckManager.svelte.ts" "DeckManager"

# Check CardStatsEditor
check_function_usage "src/lib/components/cards/CardStatsEditor.svelte" "src/lib/components/cards/CardStatsEditor.svelte.ts" "CardStatsEditor"

# Check StatblockVocabularyEditor
check_function_usage "src/lib/components/StatblockVocabularyEditor.svelte" "src/lib/components/StatblockVocabularyEditor.svelte.ts" "StatblockVocabularyEditor"

echo "🎯 AUDIT COMPLETE"
