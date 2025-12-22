require 'rspec'
require 'json'
require_relative 'price_update' # Loads your class

describe PriceUpdater do
  let(:test_file) { 'test_ingredients.json' }
  
  # 1. SETUP: Create a fake JSON file before every test
  before do
    initial_data = [
      {
        "id" => "1",
        "name" => "Test Butter (Grams)",
        "source" => "rohlik",
        "rohlik_id" => 700,
        "unit" => "g",
        "package_size" => "250g",
        "package_price" => 50.0,
        "price_per_unit" => 0.2
      },
      {
        "id" => "2",
        "name" => "Test Eggs (Pieces)",
        "source" => "rohlik",
        "rohlik_id" => 800,
        "unit" => "ks",
        "package_size" => "10ks",
        "package_price" => 50.0,
        "price_per_unit" => 5.0
      },
      {
        "id" => "3",
        "name" => "Manual Box",
        "source" => "manual",
        "rohlik_id" => nil,
        "unit" => "ks",
        "package_price" => 20.0,
        "price_per_unit" => 20.0
      }
    ]
    File.write(test_file, JSON.generate(initial_data))
  end

  # CLEANUP: Delete the fake file after tests
  after { File.delete(test_file) if File.exist?(test_file) }

  # 2. MOCK THE API
  let(:mock_api_response) do
    [
      {
        "productId" => 700, # Butter
        "price" => { "amount" => 80.0, "currency" => "CZK" },
        "pricePerUnit" => { "amount" => 320.0, "currency" => "CZK" } # 320 per kg
      },
      {
        "productId" => 800, # Eggs
        "price" => { "amount" => 100.0, "currency" => "CZK" }, 
        "pricePerUnit" => { "amount" => 10.0, "currency" => "CZK" } # Irrelevant for pieces often
      }
    ].to_json
  end

  it 'updates prices correctly for Grams (divides normalized unit by 1000)' do
    # Fake the network request
    stub_request(mock_api_response)

    # Run script
    PriceUpdater.new(test_file).run

    # Verify
    data = JSON.parse(File.read(test_file))
    butter = data.find { |i| i['id'] == "1" }

    expect(butter['package_price']).to eq(80.0)
    # Math check: 320 CZK per kg / 1000 = 0.32 per g
    expect(butter['price_per_unit']).to eq(0.32)
    expect(butter['auto_price']['status']).to eq('active')
  end

  it 'updates prices correctly for Pieces (divides price by count)' do
    stub_request(mock_api_response)

    PriceUpdater.new(test_file).run

    data = JSON.parse(File.read(test_file))
    eggs = data.find { |i| i['id'] == "2" }

    expect(eggs['package_price']).to eq(100.0)
    # Math check: 100 CZK total / 10 eggs = 10.0 per egg
    expect(eggs['price_per_unit']).to eq(10.0)
  end

  it 'ignores manual items' do
    stub_request(mock_api_response)

    PriceUpdater.new(test_file).run

    data = JSON.parse(File.read(test_file))
    box = data.find { |i| i['id'] == "3" }

    # Should remain unchanged
    expect(box['package_price']).to eq(20.0)
    expect(box['auto_price']).to be_nil
  end

  # Helper to mock Net::HTTP
  def stub_request(body_content)
    # We mock the entire Net::HTTP.start block
    http_mock = double('http')
    response_mock = double('response')
    
    allow(Net::HTTP).to receive(:start).and_yield(http_mock)
    allow(http_mock).to receive(:request).and_return(response_mock)
    allow(response_mock).to receive(:code).and_return('200')
    allow(response_mock).to receive(:body).and_return(body_content)
  end
end