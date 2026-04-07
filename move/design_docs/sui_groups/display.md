
<a name="sui_groups_display"></a>

# Module `sui_groups::display`

Module: display

Display support for <code>PermissionedGroup&lt;T&gt;</code> types.

Since <code>PermissionedGroup&lt;T&gt;</code> is defined in <code>permissioned_groups</code>, extending
packages cannot directly create <code>Display&lt;PermissionedGroup&lt;T&gt;&gt;</code>.


<a name="@Solution_0"></a>

### Solution


This module provides a shared <code><a href="../sui_groups/display.md#sui_groups_display_PermissionedGroupPublisher">PermissionedGroupPublisher</a></code> that holds the
<code>permissioned_groups</code> Publisher. Extending packages can call <code><a href="../sui_groups/display.md#sui_groups_display_setup_display">setup_display</a>&lt;T&gt;</code>
with their own Publisher to create <code>Display&lt;PermissionedGroup&lt;T&gt;&gt;</code>.


<a name="@Usage_1"></a>

### Usage


```move
module my_package::my_module;

use sui_groups::display::{Self, PermissionedGroupPublisher};
use sui::package::{Self, Publisher};

public struct MY_MODULE() has drop;
public struct MyWitness() has drop;

fun init(otw: MY_MODULE, ctx: &mut TxContext) {
    let publisher = package::claim(otw, ctx);
    // Transfer publisher to sender for later use with setup_display
    transfer::public_transfer(publisher, ctx.sender());
}

/// Call this after init to set up Display for PermissionedGroup<MyWitness>.
public fun setup_group_display(
    pg_publisher: &PermissionedGroupPublisher,
    publisher: &Publisher,
    ctx: &mut TxContext,
) {
    display::setup_display<MyWitness>(
        pg_publisher,
        publisher,
        b"My Group".to_string(),
        b"A permissioned group".to_string(),
        b"https://example.com/image.png".to_string(),
        b"https://example.com".to_string(),
        b"https://example.com/group/{id}".to_string(),
        ctx,
    );
}
```


    -  [Solution](#@Solution_0)
    -  [Usage](#@Usage_1)
-  [Struct `DISPLAY`](#sui_groups_display_DISPLAY)
-  [Struct `PermissionedGroupPublisher`](#sui_groups_display_PermissionedGroupPublisher)
-  [Constants](#@Constants_2)
-  [Function `init`](#sui_groups_display_init)
-  [Function `setup_display`](#sui_groups_display_setup_display)
    -  [Type Parameters](#@Type_Parameters_3)
    -  [Parameters](#@Parameters_4)
    -  [Aborts](#@Aborts_5)


<pre><code><b>use</b> <a href="../dependencies/std/address.md#std_address">std::address</a>;
<b>use</b> <a href="../dependencies/std/ascii.md#std_ascii">std::ascii</a>;
<b>use</b> <a href="../dependencies/std/bcs.md#std_bcs">std::bcs</a>;
<b>use</b> <a href="../dependencies/std/option.md#std_option">std::option</a>;
<b>use</b> <a href="../dependencies/std/string.md#std_string">std::string</a>;
<b>use</b> <a href="../dependencies/std/type_name.md#std_type_name">std::type_name</a>;
<b>use</b> <a href="../dependencies/std/vector.md#std_vector">std::vector</a>;
<b>use</b> <a href="../dependencies/sui/accumulator.md#sui_accumulator">sui::accumulator</a>;
<b>use</b> <a href="../dependencies/sui/accumulator_settlement.md#sui_accumulator_settlement">sui::accumulator_settlement</a>;
<b>use</b> <a href="../dependencies/sui/address.md#sui_address">sui::address</a>;
<b>use</b> <a href="../dependencies/sui/bcs.md#sui_bcs">sui::bcs</a>;
<b>use</b> <a href="../dependencies/sui/derived_object.md#sui_derived_object">sui::derived_object</a>;
<b>use</b> <a href="../dependencies/sui/display.md#sui_display">sui::display</a>;
<b>use</b> <a href="../dependencies/sui/dynamic_field.md#sui_dynamic_field">sui::dynamic_field</a>;
<b>use</b> <a href="../dependencies/sui/event.md#sui_event">sui::event</a>;
<b>use</b> <a href="../dependencies/sui/hash.md#sui_hash">sui::hash</a>;
<b>use</b> <a href="../dependencies/sui/hex.md#sui_hex">sui::hex</a>;
<b>use</b> <a href="../dependencies/sui/object.md#sui_object">sui::object</a>;
<b>use</b> <a href="../dependencies/sui/package.md#sui_package">sui::package</a>;
<b>use</b> <a href="../dependencies/sui/party.md#sui_party">sui::party</a>;
<b>use</b> <a href="../dependencies/sui/transfer.md#sui_transfer">sui::transfer</a>;
<b>use</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context">sui::tx_context</a>;
<b>use</b> <a href="../dependencies/sui/types.md#sui_types">sui::types</a>;
<b>use</b> <a href="../dependencies/sui/vec_map.md#sui_vec_map">sui::vec_map</a>;
<b>use</b> <a href="../dependencies/sui/vec_set.md#sui_vec_set">sui::vec_set</a>;
<b>use</b> <a href="../sui_groups/permissioned_group.md#sui_groups_permissioned_group">sui_groups::permissioned_group</a>;
<b>use</b> <a href="../sui_groups/permissions_table.md#sui_groups_permissions_table">sui_groups::permissions_table</a>;
<b>use</b> <a href="../sui_groups/unpause_cap.md#sui_groups_unpause_cap">sui_groups::unpause_cap</a>;
</code></pre>



<a name="sui_groups_display_DISPLAY"></a>

## Struct `DISPLAY`

OTW for claiming Publisher and initializing PermissionedGroupPublisher.


<pre><code><b>public</b> <b>struct</b> <a href="../sui_groups/display.md#sui_groups_display_DISPLAY">DISPLAY</a> <b>has</b> drop
</code></pre>



<details>
<summary>Fields</summary>


<dl>
</dl>


</details>

<a name="sui_groups_display_PermissionedGroupPublisher"></a>

## Struct `PermissionedGroupPublisher`

Shared object holding the <code>permissioned_groups</code> Publisher.
Used by extending packages to create <code>Display&lt;PermissionedGroup&lt;T&gt;&gt;</code>.


<pre><code><b>public</b> <b>struct</b> <a href="../sui_groups/display.md#sui_groups_display_PermissionedGroupPublisher">PermissionedGroupPublisher</a> <b>has</b> key
</code></pre>



<details>
<summary>Fields</summary>


<dl>
<dt>
<code>id: <a href="../dependencies/sui/object.md#sui_object_UID">sui::object::UID</a></code>
</dt>
<dd>
</dd>
<dt>
<code>publisher: <a href="../dependencies/sui/package.md#sui_package_Publisher">sui::package::Publisher</a></code>
</dt>
<dd>
</dd>
</dl>


</details>

<a name="@Constants_2"></a>

## Constants


<a name="sui_groups_display_ETypeNotFromModule"></a>

Type T is not from the same module as the publisher


<pre><code><b>const</b> <a href="../sui_groups/display.md#sui_groups_display_ETypeNotFromModule">ETypeNotFromModule</a>: u64 = 0;
</code></pre>



<a name="sui_groups_display_init"></a>

## Function `init`



<pre><code><b>fun</b> <a href="../sui_groups/display.md#sui_groups_display_init">init</a>(otw: <a href="../sui_groups/display.md#sui_groups_display_DISPLAY">sui_groups::display::DISPLAY</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>fun</b> <a href="../sui_groups/display.md#sui_groups_display_init">init</a>(otw: <a href="../sui_groups/display.md#sui_groups_display_DISPLAY">DISPLAY</a>, ctx: &<b>mut</b> TxContext) {
    transfer::share_object(<a href="../sui_groups/display.md#sui_groups_display_PermissionedGroupPublisher">PermissionedGroupPublisher</a> {
        id: object::new(ctx),
        publisher: package::claim(otw, ctx),
    });
}
</code></pre>



</details>

<a name="sui_groups_display_setup_display"></a>

## Function `setup_display`

Creates a <code>Display&lt;PermissionedGroup&lt;T&gt;&gt;</code> using the shared publisher.
The caller must provide their own Publisher to prove they own the module
that defines type T. The Display is transferred to the transaction sender.


<a name="@Type_Parameters_3"></a>

### Type Parameters

- <code>T</code>: The witness type used with <code>PermissionedGroup&lt;T&gt;</code>


<a name="@Parameters_4"></a>

### Parameters

- <code>pg_publisher</code>: Reference to the shared PermissionedGroupPublisher
- <code>publisher</code>: Reference to the extending package's Publisher (proves ownership of T)
- <code>name</code>: Display name template
- <code>description</code>: Description template
- <code>image_url</code>: Static image URL for all groups of this type
- <code>project_url</code>: Project website URL
- <code>link</code>: Link template for viewing objects, use <code>{id}</code> for object ID interpolation
- <code>ctx</code>: Transaction context


<a name="@Aborts_5"></a>

### Aborts

- <code><a href="../sui_groups/display.md#sui_groups_display_ETypeNotFromModule">ETypeNotFromModule</a></code>: if type T is not from the same module as the publisher


<pre><code><b>public</b> <b>fun</b> <a href="../sui_groups/display.md#sui_groups_display_setup_display">setup_display</a>&lt;T: drop&gt;(pg_publisher: &<a href="../sui_groups/display.md#sui_groups_display_PermissionedGroupPublisher">sui_groups::display::PermissionedGroupPublisher</a>, publisher: &<a href="../dependencies/sui/package.md#sui_package_Publisher">sui::package::Publisher</a>, name: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, description: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, image_url: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, project_url: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, link: <a href="../dependencies/std/string.md#std_string_String">std::string::String</a>, ctx: &<b>mut</b> <a href="../dependencies/sui/tx_context.md#sui_tx_context_TxContext">sui::tx_context::TxContext</a>)
</code></pre>



<details>
<summary>Implementation</summary>


<pre><code><b>public</b> <b>fun</b> <a href="../sui_groups/display.md#sui_groups_display_setup_display">setup_display</a>&lt;T: drop&gt;(
    pg_publisher: &<a href="../sui_groups/display.md#sui_groups_display_PermissionedGroupPublisher">PermissionedGroupPublisher</a>,
    publisher: &Publisher,
    name: String,
    description: String,
    image_url: String,
    project_url: String,
    link: String,
    ctx: &<b>mut</b> TxContext,
) {
    <b>assert</b>!(publisher.from_module&lt;T&gt;(), <a href="../sui_groups/display.md#sui_groups_display_ETypeNotFromModule">ETypeNotFromModule</a>);
    <b>let</b> <b>mut</b> <a href="../sui_groups/display.md#sui_groups_display">display</a> = display::new&lt;PermissionedGroup&lt;T&gt;&gt;(&pg_publisher.publisher, ctx);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"name".to_string(), name);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"description".to_string(), description);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"creator".to_string(), b"{creator}".to_string());
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"image_url".to_string(), image_url);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"project_url".to_string(), project_url);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.add(b"link".to_string(), link);
    <a href="../sui_groups/display.md#sui_groups_display">display</a>.update_version();
    transfer::public_transfer(<a href="../sui_groups/display.md#sui_groups_display">display</a>, ctx.sender());
}
</code></pre>



</details>
