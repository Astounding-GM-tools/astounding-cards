<script lang="ts">
  import type { Character } from '$lib/types';
  import { debounce } from '$lib/utils/debounce';

  export let character: Character;
  export let showCropMarks = true;
  export let onChange: (updates: Partial<Character>) => void;

  let imageUrl = '';
  let showImageInput = false;

  // For contentEditable elements, use blur
  function updateName(event: Event) {
    const target = event.target as HTMLElement;
    onChange({ name: target.innerText });
  }

  function updateRole(event: Event) {
    const target = event.target as HTMLElement;
    onChange({ role: target.innerText });
  }

  function updateTrait(index: number, event: Event) {
    const target = event.target as HTMLElement;
    const newTraits = [...character.traits];
    newTraits[index] = target.innerText;
    onChange({ traits: newTraits });
  }

  // Debounced age update
  const debouncedAgeUpdate = debounce((age: string) => {
    onChange({ age });
  }, 300);

  function updateAge(event: Event) {
    const target = event.target as HTMLInputElement;
    const age = target.value || "0";
    if (parseInt(age) > 0) {
      debouncedAgeUpdate(age);
    }
  }

  function addTrait() {
    if (character.traits.length >= 5) return;
    const newTraits = [...character.traits, "New trait"];
    onChange({ traits: newTraits });
  }

  function removeTrait(index: number) {
    const newTraits = character.traits.filter((_: string, i: number) => i !== index);
    onChange({ traits: newTraits });
  }

  function updatePortrait() {
    if (!imageUrl) return;
    onChange({ portrait: imageUrl });
    imageUrl = '';
    showImageInput = false;
  }
</script>

<article 
  class="card" 
  class:show-crop-marks={showCropMarks}
  style:background-image={character.portrait ? `url(/portraits/${character.portrait})` : undefined}
>
  <section>
    <h2 
      contenteditable="true" 
      on:blur={updateName}
      class="editable"
    >{character.name}</h2>
    
    <div class="meta">
      <p 
        contenteditable="true" 
        on:blur={updateRole}
        class="role editable"
      >{character.role}</p>
      <p class="age">Age: <input 
        type="number" 
        value={character.age}
        on:input={updateAge}
        min="1"
        max="999"
      /></p>
    </div>

    <ul class="traits">
      {#each character.traits as trait, i}
        <li>
          <span 
            contenteditable="true" 
            on:blur={(e) => updateTrait(i, e)}
            class="editable"
          >{trait}</span>
          <button 
            class="remove-trait" 
            on:click={() => removeTrait(i)}
            title="Remove trait"
          >×</button>
        </li>
      {/each}
      {#if character.traits.length < 5}
        <li>
          <button class="add-trait" on:click={addTrait}>
            + Add trait
          </button>
        </li>
      {/if}
    </ul>
  </section>

  <button 
    class="change-portrait" 
    on:click={() => showImageInput = !showImageInput}
    title="Change portrait"
  >
    {#if character.portrait}
      Change portrait
    {:else}
      Add portrait
    {/if}
  </button>

  {#if showImageInput}
    <div class="image-input">
      <input 
        type="text"
        bind:value={imageUrl}
        placeholder="Enter image URL"
      />
      <button on:click={updatePortrait}>Set</button>
      <button on:click={() => showImageInput = false}>Cancel</button>
    </div>
  {/if}
</article>

<style>
  .card {
    position: relative;
    width: 63.5mm;
    height: 88.9mm;
    background-color: white;
    background-size: cover;
    background-position: center;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 3mm;
    box-sizing: border-box;
    font-size: 8pt;
    gap: 2mm;
  }

  section {
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 2mm;
    border-radius: 1mm;
    margin: 0 -1mm;
  }

  h2 {
    margin: 0;
    font-size: 10pt;
    font-weight: bold;
  }

  .meta {
    margin: 1mm 0 2mm;
    text-align: center;
  }

  .role {
    margin: 0;
    font-style: italic;
  }

  .role::after {
    content: ". ";
  }

  .age {
    margin: 0.5mm 0 0;
    font-size: inherit;
  }

  .age input {
    width: 3em;
    font-size: inherit;
    padding: 0;
    border: none;
    border-bottom: 1px solid transparent;
    background: transparent;
    text-align: center;
  }

  .age input:hover,
  .age input:focus {
    border-bottom-color: #666;
    outline: none;
  }

  .traits {
    list-style-type: none;
    padding: 0;
    margin: 0 -1mm;
    gap: 1mm;
    text-align: left;
  }

  .traits li {
    padding: 0.5mm 2mm;
    font-size: 7pt;
    display: flex;
    gap: 1mm;
    align-items: center;
  }

  .traits span {
    flex: 1;
  }

  .editable {
    position: relative;
    transition: background-color 0.2s;
  }

  .editable:hover::after {
    content: '✎';
    position: absolute;
    right: -3mm;
    top: 50%;
    transform: translateY(-50%);
    font-size: 7pt;
    color: #666;
    opacity: 0.5;
  }

  .editable:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.5);
  }

  .remove-trait,
  .add-trait {
    background: none;
    border: none;
    padding: 0;
    font-size: inherit;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .traits li:hover .remove-trait {
    opacity: 0.5;
  }

  .remove-trait:hover {
    opacity: 1 !important;
    color: #c00;
  }

  .add-trait {
    opacity: 0.5;
    width: 100%;
    text-align: center;
    padding: 1mm;
  }

  .add-trait:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.5);
  }

  .change-portrait {
    position: absolute;
    top: 3mm;
    right: 3mm;
    background: rgba(255, 255, 255, 0.8);
    border: none;
    padding: 1mm 2mm;
    border-radius: 1mm;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 7pt;
  }

  .card:hover .change-portrait {
    opacity: 0.8;
  }

  .change-portrait:hover {
    opacity: 1 !important;
  }

  .image-input {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 2mm;
    border-radius: 1mm;
    display: flex;
    gap: 1mm;
    box-shadow: 0 1mm 2mm rgba(0,0,0,0.1);
  }

  .image-input input {
    border: 1px solid #ddd;
    padding: 1mm;
    border-radius: 0.5mm;
    min-width: 30mm;
  }

  .image-input button {
    border: none;
    background: #eee;
    padding: 1mm 2mm;
    border-radius: 0.5mm;
    cursor: pointer;
  }

  .image-input button:hover {
    background: #ddd;
  }

  @media print {
    .editable::after,
    .remove-trait,
    .add-trait,
    .change-portrait,
    .image-input {
      display: none;
    }

    .meta {
      display: inline;
    }

    .role {
      display: inline;
    }

    .role::after {
      content: ". ";
    }

    .age {
      display: inline;
      margin: 0;
    }

    .age input {
      border: none;
    }
  }

  /* Crop marks as pseudo elements */
  .show-crop-marks::before,
  .show-crop-marks::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 6mm;
    border-top: 0.3mm solid black;
  }

  .show-crop-marks::before {
    top: -3mm;
  }

  .show-crop-marks::after {
    bottom: -3mm;
  }

  /* Using first and last child for vertical marks */
  .show-crop-marks > :first-child::before,
  .show-crop-marks > :last-child::after {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 6mm;
    border-left: 0.3mm solid black;
  }

  .show-crop-marks > :first-child::before {
    left: -3mm;
  }

  .show-crop-marks > :last-child::after {
    right: -3mm;
  }

  /* Hide redundant crop marks */
  /* Middle column (2,5,8) - hide vertical marks */
  :global(.card-grid > :nth-child(3n-1).show-crop-marks) > :first-child::before,
  :global(.card-grid > :nth-child(3n-1).show-crop-marks) > :last-child::after {
    display: none;
  }

  /* Middle row (4,5,6) - hide horizontal marks */
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6).show-crop-marks)::before,
  :global(.card-grid > :nth-child(n+4):nth-child(-n+6).show-crop-marks)::after {
    display: none;
  }
</style> 