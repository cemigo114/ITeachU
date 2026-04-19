---
ccss_code: "HSN-VM.C"
grade_level: "High School"
domain: "Number and Quantity"
cluster: "Perform operations on matrices and use matrices in applications."
standard_statement: "Perform operations on matrices and use matrices in applications."
task_title: "The Inventory Grid"
filename: "HSN-VM.C_inventory-grid.md"
---

# HSN-VM.C · High School · Number and Quantity/Perform operations on matrices and use matrices in applications.
## "The Inventory Grid"
*Perform operations on matrices and use matrices in applications.*

---

## 1. Student Prompt
"My family owns two smoothie shops, and we keep track of how many strawberry, banana, and kale boosts we use every day in these grids. The North shop used 20, 15, and 10 yesterday, and the South shop used 25, 30, and 5, but today we’re running a 'Double Boost' promotion at both locations. If I just take the grids from yesterday and double every single number in them, will that actually tell me how many total boosts we need to order for both shops today?"

---

## 2. Possible Misconceptions

1. **Scalar-Dimension Confusion** *(Type: structural_misunderstanding)* Students may attempt to add the scalar '2' to every element in the matrix rather than multiplying each element by the scalar.

2. **Non-Corresponding Addition** *(Type: procedural_overgeneralization)* Students might add numbers that do not share the same position in the grid, such as adding strawberry usage from North to kale usage from South.

3. **Multiplicative Scale Error** *(Type: additive_vs_multiplicative_confusion)* Students may add 2 to each value to represent 'doubling' instead of multiplying by 2.

---

## 3. Pattern Recognition Prompts

- "Wait—if the North shop uses more strawberries than the South shop, does that difference get bigger or stay the same after the 'Double Boost'?"
- "Okay, but is there a number in these grids that stays exactly where it is no matter which shop we're looking at?"
- "Does doubling each shop first and then adding them together give the same result as adding the shops first and then doubling the total?"

---

## 4. Generalization Question (Always / Sometimes / Never)
"If we have a grid of our boost usage and we decide to triple everything, will the new total for the whole week ALWAYS be three times the old total?"

---

## 5. Inference and Prediction
"I found a different grid for our 'Mega-Green' smoothies where we use 2 cups of spinach and 1 cup of protein per drink. If we sell 50 of these at the North shop and 80 at the South shop, is there a way to calculate the total spinach and protein needed for both shops without calculating each location separately? What if we added a third shop next month—would the 'grid way' of adding them up still work to find the total?"

**Prediction target:** The total amount of spinach needed if a third shop opens and also sells 60 'Mega-Green' smoothies.

---

## 6. Mapping and Process Data

### Claims
- Students can perform scalar multiplication and matrix addition to represent changes in real-world data sets.
- Students can interpret the resulting matrix elements in the context of the combined inventory needs of multiple locations.

### Evidence
Evidence is gathered when a student explains that doubling each element (scalar multiplication) and then combining the grids (matrix addition) preserves the relationship between the types of boosts. The task forces reasoning by asking the student to compare two different orders of operations (distributive property of scalars over matrix addition) to see if the final inventory count remains consistent.

### Process Data Revealing Critical Thinking
A student demonstrates deep understanding when they realize that matrices must have identical dimensions to be combined, effectively self-correcting if they initially try to add a 3-item boost list to a 2-item ingredient list. Critical thinking is revealed when a student conjectures that scalar multiplication scales the entire data system proportionally.
---