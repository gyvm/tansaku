use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "vozoo", about = "Vozoo audio effects CLI")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Process a WAV file offline with a preset, chain, or graph
    Process {
        /// Input WAV file path
        input: String,
        /// Output WAV file path
        output: String,
        /// Preset ID (0=Gorilla, 1=Cat, 2=Robot, 3=Chorus, 4=Reverb)
        #[arg(long, group = "mode")]
        preset: Option<i32>,
        /// Chain JSON (inline string or path to .json file)
        #[arg(long, group = "mode")]
        chain: Option<String>,
        /// Graph JSON (inline string or path to .json file)
        #[arg(long, group = "mode")]
        graph: Option<String>,
    },
    /// Start real-time mic-to-speaker processing
    Realtime {
        /// Chain JSON (inline string or path to .json file)
        #[arg(long, group = "mode")]
        chain: Option<String>,
        /// Graph JSON (inline string or path to .json file)
        #[arg(long, group = "mode")]
        graph: Option<String>,
        /// Record output to WAV file
        #[arg(long)]
        record: Option<String>,
    },
    /// List available effect presets
    ListPresets,
    /// List available effect nodes and their parameters
    ListNodes,
}

fn resolve_json(value: &str) -> Result<String, String> {
    if value.trim_start().starts_with('{') || value.trim_start().starts_with('[') {
        Ok(value.to_string())
    } else {
        std::fs::read_to_string(value)
            .map_err(|e| format!("Failed to read '{}': {}", value, e))
    }
}

fn run_process(
    input: &str,
    output: &str,
    preset: Option<i32>,
    chain: Option<&str>,
    graph: Option<&str>,
) -> Result<(), String> {
    let result = if let Some(id) = preset {
        vozoo_nodes::process_file(input, output, id)
    } else if let Some(json_arg) = chain {
        let json = resolve_json(json_arg)?;
        vozoo_nodes::process_file_with_chain(input, output, &json)
    } else if let Some(json_arg) = graph {
        let json = resolve_json(json_arg)?;
        vozoo_nodes::process_file_with_graph(input, output, &json)
    } else {
        return Err("Provide one of --preset, --chain, or --graph".into());
    };

    match result {
        0 => {
            println!("Written to {}", output);
            Ok(())
        }
        -1 => Err(format!("Failed to read input file: {}", input)),
        -2 => Err(format!("Failed to write output file: {}", output)),
        -3 => Err("Invalid JSON definition".into()),
        code => Err(format!("Processing failed with code {}", code)),
    }
}

fn run_realtime(
    chain: Option<&str>,
    graph: Option<&str>,
    record: Option<&str>,
) -> Result<(), String> {
    let mut engine = vozoo_io::RealtimeEngine::new();

    if let Some(json_arg) = chain {
        let json = resolve_json(json_arg)?;
        engine.set_chain(&json)?;
    } else if let Some(json_arg) = graph {
        let json = resolve_json(json_arg)?;
        engine.set_graph(&json)?;
    }

    engine.start()?;
    println!("Realtime engine running. Press Enter to stop.");

    if let Some(path) = record {
        engine.start_recording(path)?;
        println!("Recording to {}", path);
    }

    let mut buf = String::new();
    std::io::stdin().read_line(&mut buf).ok();

    let duration_ms = engine.stop_recording();
    engine.stop();

    if let Some(path) = record {
        println!("Recorded {} ms to {}", duration_ms, path);
    }
    if let Some(err) = engine.take_last_error() {
        eprintln!("Warning: {}", err);
    }
    Ok(())
}

fn list_presets() {
    let chains = vozoo_nodes::preset_chain_defs();
    println!("Chain Presets:");
    for (i, def) in chains.iter().enumerate() {
        let node_types: Vec<&str> = def.nodes.iter().map(|n| n.node_type.as_str()).collect();
        println!("  [{}] {} — {}", i, def.name, node_types.join(" → "));
    }
    println!();
    let graphs = vozoo_nodes::preset_graph_defs();
    println!("Graph Presets:");
    for def in &graphs {
        println!(
            "  {} ({} nodes, {} edges)",
            def.name,
            def.nodes.len(),
            def.edges.len()
        );
    }
}

fn list_nodes() {
    let nodes = vozoo_nodes::available_nodes();
    let mut current_category = String::new();
    for node in &nodes {
        if node.category != current_category {
            println!("\n[{}]", node.category);
            current_category.clone_from(&node.category);
        }
        print!("  {} (type: \"{}\")", node.name, node.node_type);
        if node.params.is_empty() {
            println!();
        } else {
            println!();
            for p in &node.params {
                println!("    {} [{} .. {}] default={}", p.key, p.min, p.max, p.default);
            }
        }
    }
}

fn main() {
    let cli = Cli::parse();
    let result = match cli.command {
        Commands::Process {
            input,
            output,
            preset,
            chain,
            graph,
        } => run_process(&input, &output, preset, chain.as_deref(), graph.as_deref()),
        Commands::Realtime {
            chain,
            graph,
            record,
        } => run_realtime(chain.as_deref(), graph.as_deref(), record.as_deref()),
        Commands::ListPresets => {
            list_presets();
            Ok(())
        }
        Commands::ListNodes => {
            list_nodes();
            Ok(())
        }
    };
    if let Err(e) = result {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
