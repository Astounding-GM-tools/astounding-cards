<script lang="ts">
    const { back } = $props<{
        back?: boolean;
    }>();
</script>

<span class="trait-list">TraitList {back ? 'back' : 'front'}</span>

<style>
    .trait-list {
        display: inline-block;
        padding: 0.5em;
        background: lightblue;
        border-radius: 14px;
        font-size: 12px;
        text-align: center;
        margin: 4px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        max-width: 100cqw;
    }
</style>